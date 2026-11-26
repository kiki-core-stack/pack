import type { Context } from 'hono';
import {
    deleteCookie,
    getCookie,
    setCookie,
} from 'hono/cookie';

import type { AuthLoginOutcome } from '../../../../libs/auth/login';
import type { AuthRealm } from '../../../../libs/auth/realm';
import { revokeAuthSession } from '../../../../libs/auth/session';
import type { CreatedAuthSession } from '../../../../libs/auth/session';
import type { AuthRequestInfo } from '../../../../libs/auth/types';
import type { AuthLoginResultData } from '../../../../types/data/auth';
import type { HonoAuthOptions } from '../../../types/auth';
import { createApiSuccessResponseData } from '../../api';

// Functions

/**
 * Applies the outcome of a login to the response and returns what the client is told: a completed login sets the
 * session cookie, and one waiting for its second factor only hands out the challenge.
 */
export async function applyAuthLoginOutcome(
    ctx: Context,
    realm: AuthRealm<any>,
    outcome: AuthLoginOutcome,
): Promise<AuthLoginResultData> {
    if (outcome.state === 'secondFactorRequired') {
        return {
            challengeId: outcome.challengeId,
            factors: outcome.factors,
            state: outcome.state,
        };
    }

    await replaceAuthSessionCookie(ctx, realm, outcome.created);
    return {
        restricted: outcome.created.session.restricted,
        state: outcome.state,
    };
}

// The return type is annotated: the inferred typed response of a generic `data` is too long to be serialized.
export function createApiSuccessResponse<D extends object | undefined = undefined>(ctx: Context, data?: D): Response {
    return ctx.json(createApiSuccessResponseData(data));
}

export function deleteAuthSessionCookie(ctx: Context, realm: AuthRealm<any>) {
    deleteCookie(
        ctx,
        realm.cookieName,
        {
            path: '/',
            secure: true,
        },
    );
}

export function getAuthRequestInfo(ctx: Context, options: HonoAuthOptions): AuthRequestInfo {
    return {
        ip: options.getClientIp(ctx),
        userAgent: ctx.req.header('user-agent'),
    };
}

export function getAuthSessionToken(ctx: Context, realm: AuthRealm<any>) {
    return getCookie(ctx, realm.cookieName);
}

/**
 * Sets the session issued by a login; logging in while already holding a valid session revokes that one.
 */
export async function replaceAuthSessionCookie(ctx: Context, realm: AuthRealm<any>, created: CreatedAuthSession) {
    if (ctx.authSession) await revokeAuthSession(realm, ctx.authSession.principalId, ctx.authSession.id);
    setAuthSessionCookie(ctx, realm, created);
}

/**
 * Sets the session cookie: `__Host-` prefixed, HttpOnly, Secure, without `Domain`, living as long as the session's
 * absolute timeout.
 */
export function setAuthSessionCookie(ctx: Context, realm: AuthRealm<any>, created: CreatedAuthSession) {
    setCookie(
        ctx,
        realm.cookieName,
        created.token,
        {
            httpOnly: true,
            maxAge: created.maxAgeSeconds,
            path: '/',
            sameSite: realm.cookieSameSite,
            secure: true,
        },
    );

    ctx.header('cache-control', 'no-store');
}
