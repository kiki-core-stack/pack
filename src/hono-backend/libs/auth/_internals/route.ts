import type {
    Context,
    MiddlewareHandler,
} from 'hono';

import { AuthError } from '../../../../libs/auth/error';
import type { AuthRealm } from '../../../../libs/auth/realm';
import * as z from '../../../../libs/zod/backend';
import type {
    AuthOperationContext,
    AuthPrincipal,
    AuthRequestInfo,
    AuthSession,
} from '../../../../types/auth';
import type { AuthSessionData } from '../../../../types/data/auth';
import type {
    AuthRouteDefinition,
    AuthRouteMeta,
    HonoAuthOptions,
} from '../../../types/auth';

import { getAuthRequestInfo } from './context';

/**
 * What the route groups of a realm share.
 */
export interface AuthRoutesContext<P extends AuthPrincipal> {
    /**
     * Consumes the one-time verification grant of a high-risk operation.
     */
    assertVerification: (ctx: Context, operation: string) => Promise<void>;
    getOperationContext: (ctx: Context) => AuthOperationContext;

    /**
     * The account of the authenticated session.
     */
    getPrincipal: (ctx: Context) => Promise<P>;
    getRequest: (ctx: Context) => AuthRequestInfo;

    /**
     * The authenticated session; only for routes that require login.
     */
    getSession: (ctx: Context) => AuthSession;
    realm: AuthRealm<P>;
}

// Constants
export const idSchema = z.string().min(1).max(1024);

// The WebAuthn responses are verified by the WebAuthn library; only their outline is validated here.
export const webauthnResponseSchema = z.looseObject({
    id: idSchema,
    rawId: z.string(),
    response: z.looseObject({}),
    type: z.literal('public-key'),
});

export const secondFactorProofSchema = z.discriminatedUnion(
    'factor',
    [
        z.object({
            code: z.string().trim().min(1).max(64),
            factor: z.enum([
                'recoveryCode',
                'totp',
            ]),
        }),
        z.object({
            challengeId: idSchema,
            factor: z.literal('passkey'),
            response: webauthnResponseSchema,
        }),
    ],
);

// Functions
export function createAuthRoutesContext<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    options: HonoAuthOptions,
    assertVerification: AuthRoutesContext<P>['assertVerification'],
): AuthRoutesContext<P> {
    const getRequest = (ctx: Context) => getAuthRequestInfo(ctx, options);
    const getSession = (ctx: Context) => ctx.authSession!;
    return {
        assertVerification,
        getOperationContext: (ctx) => ({
            request: getRequest(ctx),
            sessionId: getSession(ctx).id,
        }),
        async getPrincipal(ctx) {
            const principal = await realm.findPrincipalById(getSession(ctx).principalId);
            if (!principal) throw new AuthError('sessionInvalid');
            return principal;
        },
        getRequest,
        getSession,
        realm,
    };
}

export function defineAuthRoute(meta: AuthRouteMeta, ...handlers: unknown[]): AuthRouteDefinition {
    return {
        handlers: handlers as MiddlewareHandler[],
        meta,
    };
}

export function toAuthSessionData(session: AuthSession, currentSessionId?: string): AuthSessionData {
    return {
        approvedBySessionId: session.approvedBySessionId,
        createdAt: new Date(session.createdAt).toISOString(),
        current: session.id === currentSessionId,
        factors: session.factors,
        id: session.id,
        ip: session.ip,
        lastActiveAt: new Date(session.lastActiveAt).toISOString(),
        userAgent: session.userAgent,
    };
}
