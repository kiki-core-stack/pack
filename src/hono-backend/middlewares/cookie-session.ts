import { Buffer } from 'node:buffer';

import type {
    Context,
    MiddlewareHandler,
} from 'hono';
import {
    deleteCookie,
    getCookie,
    setCookie,
} from 'hono/cookie';
import { Gcm } from 'node-ciphers/aes';
import onChange from 'on-change';

import { baseSetCookieOptions } from '../constants/cookie';
import type {
    CookieSessionData,
    CookieSessionOptions,
    CookieSessionTokenHandler,
    PartialCookieSessionData,
} from '../types/cookie-session';

declare module 'hono' {
    interface Context {
        clearCookieSession: () => void;

        /**
         * Data stored in the encrypted cookie; assigning to it saves the cookie automatically.
         */
        cookieSession: PartialCookieSessionData;
        popCookieSession: <K extends keyof CookieSessionData>(key: K) => CookieSessionData[K] | undefined;
    }
}

// Stored token layout: base64 authTag (24 chars) + base64 iv (16 chars) + base64 ciphertext of [issuedAtMs, data].
type StoredData = [number, PartialCookieSessionData];

// Constants/Variables
const authTagLength = 24;
const ivLength = 16;

// Functions

/**
 * Cookie session as an encrypted (AES-256-GCM) and tamper-proof token holding small per-browser data, e.g. OAuth state.
 *
 * It is stateless: nothing is stored on the server, so an old token stays valid until it expires. Do not rely on it for
 * single-use values or revocation; use a server-side store for those.
 */
export function cookieSession(options: CookieSessionOptions): MiddlewareHandler {
    // Base64 never contains commas, so a comma-separated string (e.g. from an env variable) is a list of keys.
    const keys = [options.keys].flat().flatMap((value) => value.split(',')).map((key) => key.trim()).filter(Boolean);
    const ciphers = keys.map((key) => {
        const keyBuffer = Buffer.from(key, 'base64');
        if (keyBuffer.length !== 32) throw new Error('Cookie session keys must be base64-encoded 32-byte keys');
        return new Gcm(
            keyBuffer,
            {
                authTag: 'base64',
                decryptInput: 'base64',
                encryptOutput: 'base64',
                iv: 'base64',
            },
        );
    });

    if (!ciphers.length) throw new Error('At least one cookie session key is required');
    const maxAgeSeconds = options.maxAge ?? 86400;
    const maxTokenLength = options.maxTokenLength ?? 3800;
    const { tokenHandler } = options;

    // Functions
    function decrypt(token: string) {
        const authTag = token.substring(0, authTagLength);
        const iv = token.substring(authTagLength, authTagLength + ivLength);
        const data = token.substring(authTagLength + ivLength);
        for (const cipher of ciphers) {
            const result = cipher.decryptToJson(data, iv, authTag);
            if (!result.ok) continue;
            const [issuedAt, sessionData] = result.value as StoredData;
            return issuedAt + maxAgeSeconds * 1000 > Date.now() ? sessionData : undefined;
        }
    }

    function encrypt(sessionData: PartialCookieSessionData) {
        const result = ciphers[0]!.encryptJson([
            Date.now(),
            sessionData,
        ] satisfies StoredData);

        if (!result.ok) throw new Error('Failed to encrypt cookie session data', { cause: result.error });
        const {
            authTag,
            data,
            iv,
        } = result.value;

        return `${authTag}${iv}${data}`;
    }

    return async (ctx, next) => {
        let changed = false;
        let cleared = false;
        const token = tokenHandler.get(ctx);
        const decryptedData = token ? decrypt(token) : undefined;
        if (token && !decryptedData) tokenHandler.delete(ctx);

        const track = (sessionData: PartialCookieSessionData) => {
            const proxy = onChange(
                sessionData,
                () => {
                    onChange.unsubscribe(proxy);
                    changed = true;
                    cleared = false;
                },
                { ignoreSymbols: true },
            );

            return proxy;
        };

        ctx.cookieSession = track(decryptedData ?? {});
        ctx.clearCookieSession = () => {
            onChange.unsubscribe(ctx.cookieSession);
            cleared = true;
            ctx.cookieSession = track({});
        };

        ctx.popCookieSession = (key) => {
            const value = ctx.cookieSession[key];
            if (value !== undefined) delete ctx.cookieSession[key];
            return value;
        };

        // Hono turns handler errors into responses, so this also runs for error responses.
        await next();
        if (cleared) {
            if (decryptedData) tokenHandler.delete(ctx);
            ctx.header('cache-control', 'no-store');
        } else if (changed) {
            const newToken = encrypt(ctx.cookieSession);
            if (newToken.length > maxTokenLength) {
                throw new Error(`Cookie session token is too large (${newToken.length} > ${maxTokenLength})`);
            }

            tokenHandler.set(ctx, newToken, maxAgeSeconds);
            ctx.header('cache-control', 'no-store');
        }
    };
}

/**
 * Token handler keeping the token in a `__Host-` cookie (HttpOnly, Secure, SameSite=Strict).
 */
export function createCookieTokenHandler(name = 'session'): CookieSessionTokenHandler {
    return {
        delete: (ctx) => {
            deleteCookie(
                ctx,
                name,
                {
                    path: '/',
                    prefix: 'host',
                    secure: true,
                },
            );
        },
        get: (ctx) => getCookie(ctx, name, 'host'),
        set: (ctx, token, maxAgeSeconds) => {
            setCookie(
                ctx,
                name,
                token,
                {
                    ...baseSetCookieOptions,
                    maxAge: maxAgeSeconds,
                    prefix: 'host',
                },
            );
        },
    };
}

/**
 * Token handler keeping the token in a request header and a `set-<name>` response header, for non-browser clients.
 */
export function createHeaderTokenHandler(name = 'session'): CookieSessionTokenHandler {
    return {
        delete: (ctx: Context) => {
            ctx.header(`set-${name}`, '');
        },
        get: (ctx) => ctx.req.header(name),
        set: (ctx, token) => {
            ctx.header(`set-${name}`, token);
        },
    };
}
