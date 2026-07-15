import type { Context } from 'hono';
import {
    deleteCookie,
    getCookie,
    setCookie,
} from 'hono/cookie';
import type { Except } from 'type-fest';

import type {
    AuthenticateAuthenticationSessionInput,
    CreateAuthenticationSessionInput,
    RedisAuthenticationSessionStore,
    RotateAuthenticationSessionInput,
} from '../../stores/redis/authentication-session';
import type { AuthenticationSessionData } from '../../types/data/authentication-session';
import { baseSetCookieOptions } from '../constants/cookie';

// Types
export interface HonoAuthenticationSession {
    authenticate: (ctx: Context, input: Except<AuthenticateAuthenticationSessionInput, 'token'>) => Promise<
        AuthenticationSessionData | undefined
    >;

    create: (ctx: Context, input: CreateAuthenticationSessionInput) => Promise<AuthenticationSessionData>;
    deleteCookie: (ctx: Context) => void;
    rotate: (ctx: Context, input: Except<RotateAuthenticationSessionInput, 'token'>) => Promise<
        AuthenticationSessionData | undefined
    >;
}

export interface HonoAuthenticationSessionOptions {
    cookieName: string;
    store: Pick<RedisAuthenticationSessionStore, 'authenticate' | 'create' | 'rotate'>;
}

// Functions
export function createHonoAuthenticationSession(options: HonoAuthenticationSessionOptions): HonoAuthenticationSession {
    function removeCookie(ctx: Context) {
        deleteCookie(
            ctx,
            options.cookieName,
            {
                path: '/',
                prefix: 'host',
                secure: true,
            },
        );

        ctx.header('Cache-Control', 'no-store');
    }

    function writeCookie(ctx: Context, token: string, ttlSeconds: number) {
        setCookie(
            ctx,
            options.cookieName,
            token,
            {
                ...baseSetCookieOptions,
                maxAge: ttlSeconds,
                prefix: 'host',
            },
        );

        ctx.header('Cache-Control', 'no-store');
    }

    async function authenticate(ctx: Context, input: Except<AuthenticateAuthenticationSessionInput, 'token'>) {
        const token = getCookie(ctx, options.cookieName, 'host');
        if (!token) return;

        const authenticated = await options.store.authenticate({
            ...input,
            token,
        });

        if (!authenticated) return;

        ctx.header('Cache-Control', 'no-store');
        if (authenticated.refreshedTtlSeconds !== undefined) writeCookie(ctx, token, authenticated.refreshedTtlSeconds);

        return authenticated.session;
    }

    async function create(ctx: Context, input: CreateAuthenticationSessionInput) {
        const created = await options.store.create(input);
        writeCookie(ctx, created.token, created.ttlSeconds);

        return created.session;
    }

    async function rotate(ctx: Context, input: Except<RotateAuthenticationSessionInput, 'token'>) {
        const token = getCookie(ctx, options.cookieName, 'host');
        if (!token) return;

        const rotated = await options.store.rotate({
            ...input,
            token,
        });

        if (!rotated) return;

        writeCookie(ctx, rotated.token, rotated.ttlSeconds);

        return rotated.session;
    }

    return {
        authenticate,
        create,
        deleteCookie: removeCookie,
        rotate,
    };
}
