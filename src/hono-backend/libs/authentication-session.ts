import type { Context } from 'hono';
import {
    deleteCookie as deleteHonoCookie,
    getCookie,
    setCookie,
} from 'hono/cookie';
import type { Except } from 'type-fest';

import type {
    AuthenticateAuthenticationSessionInput,
    AuthenticationSessionPrincipalValidationData,
    AuthenticationSessionQrCodeLoginCompletionResult,
    AuthenticationSessionStore,
    CompleteAuthenticationSessionQrCodeLoginInput,
    CreateAuthenticationSessionInput,
    RotateAuthenticationSessionInput,
} from '../../types/authentication-session';
import type { AuthenticationSessionData } from '../../types/data/authentication-session';
import { baseSetCookieOptions } from '../constants/cookie';

// Types

/**
 * May cache the authoritative principal on the request context, but callers must use the returned
 * authentication session as the authorization gate because Redis finalization occurs afterward.
 */
export type HonoAuthenticationSessionPrincipalValidator = (
    ctx: Context,
    data: AuthenticationSessionPrincipalValidationData,
) => Promise<boolean>;

type HonoAuthenticationSessionQrCodeLoginCompletionResult =
  | Extract<AuthenticationSessionQrCodeLoginCompletionResult, { state: 'pending' }>
  | {
      session: AuthenticationSessionData;
      state: 'completed';
  };

interface HonoAuthenticationSession {
    authenticate: (
        ctx: Context,
        input: Except<AuthenticateAuthenticationSessionInput, 'token' | 'validatePrincipal'>,
    ) => Promise<AuthenticationSessionData | undefined>;

    completeQrCodeLogin: (
        ctx: Context,
        input: Except<CompleteAuthenticationSessionQrCodeLoginInput, 'validatePrincipal'>,
    ) => Promise<HonoAuthenticationSessionQrCodeLoginCompletionResult | undefined>;

    create: (ctx: Context, input: CreateAuthenticationSessionInput) => Promise<AuthenticationSessionData>;
    deleteCookie: (ctx: Context) => void;
    rotate: (ctx: Context, input: Except<RotateAuthenticationSessionInput, 'token' | 'validatePrincipal'>) => Promise<
        AuthenticationSessionData | undefined
    >;
}

export interface HonoAuthenticationSessionOptions {
    cookieName: string;
    store: Pick<AuthenticationSessionStore, 'authenticate' | 'create' | 'qrCodeLogin' | 'rotate'>;
    validatePrincipal: HonoAuthenticationSessionPrincipalValidator;
}

// Functions
export function createHonoAuthenticationSession(options: HonoAuthenticationSessionOptions): HonoAuthenticationSession {
    function deleteCookie(ctx: Context) {
        deleteHonoCookie(
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

    function writeCookie(ctx: Context, token: string, maxAgeSeconds: number) {
        setCookie(
            ctx,
            options.cookieName,
            token,
            {
                ...baseSetCookieOptions,
                maxAge: maxAgeSeconds,
                prefix: 'host',
            },
        );

        ctx.header('Cache-Control', 'no-store');
    }

    async function authenticate(
        ctx: Context,
        input: Except<AuthenticateAuthenticationSessionInput, 'token' | 'validatePrincipal'>,
    ) {
        const token = getCookie(ctx, options.cookieName, 'host');
        if (!token) return;

        const authenticated = await options.store.authenticate({
            ...input,
            token,
            validatePrincipal: (data) => options.validatePrincipal(ctx, data),
        });

        if (!authenticated) return;

        ctx.header('Cache-Control', 'no-store');

        return authenticated;
    }

    async function create(ctx: Context, input: CreateAuthenticationSessionInput) {
        const created = await options.store.create(input);
        writeCookie(ctx, created.token, created.cookieMaxAgeSeconds);

        return created.session;
    }

    async function completeQrCodeLogin(
        ctx: Context,
        input: Except<CompleteAuthenticationSessionQrCodeLoginInput, 'validatePrincipal'>,
    ): Promise<HonoAuthenticationSessionQrCodeLoginCompletionResult | undefined> {
        ctx.header('Cache-Control', 'no-store');

        const completed = await options.store.qrCodeLogin.complete({
            ...input,
            validatePrincipal: (data) => options.validatePrincipal(ctx, data),
        });

        if (!completed || completed.state === 'pending') return completed;

        writeCookie(ctx, completed.token, completed.cookieMaxAgeSeconds);

        return {
            session: completed.session,
            state: completed.state,
        };
    }

    async function rotate(
        ctx: Context,
        input: Except<RotateAuthenticationSessionInput, 'token' | 'validatePrincipal'>,
    ) {
        const token = getCookie(ctx, options.cookieName, 'host');
        if (!token) return;

        const rotated = await options.store.rotate({
            ...input,
            token,
            validatePrincipal: (data) => options.validatePrincipal(ctx, data),
        });

        if (!rotated) return;

        writeCookie(ctx, rotated.token, rotated.cookieMaxAgeSeconds);

        return rotated.session;
    }

    return {
        authenticate,
        completeQrCodeLogin,
        create,
        deleteCookie,
        rotate,
    };
}
