import { EnhancedDate } from '@kikiutils/shared/classes/enhanced-date';
import type {
    Context,
    MiddlewareHandler,
} from 'hono';

import { AuthError } from '../../../../libs/auth/error';
import type { AuthRealm } from '../../../../libs/auth/realm';
import type {
    AuthOperationContext,
    AuthPrincipal,
    AuthRequestInfo,
    AuthSession,
} from '../../../../libs/auth/types';
import * as z from '../../../../libs/zod/backend';
import type { AuthSessionData } from '../../../../types/data/auth';
import type {
    AuthRouteDefinition,
    AuthRouteMeta,
    HonoAuthOptions,
} from '../../../types/auth';

import { getAuthRequestInfo } from './context';

export interface AuthRoutesContext<P extends AuthPrincipal> {
    /**
     * Consumes the one-time verification grant of a high-risk operation.
     */
    assertVerification: (ctx: Context, operation: string) => Promise<void>;
    getOperationContext: (ctx: Context) => AuthOperationContext;
    getPrincipal: (ctx: Context) => Promise<P>;
    getRequest: (ctx: Context) => AuthRequestInfo;

    /**
     * The authenticated session; only for routes that require login.
     */
    getSession: (ctx: Context) => AuthSession;
    realm: AuthRealm<P>;
}

// Constants
export const accountSchema = z.string().trim().min(1).max(256);
// A code typed in by the user: TOTP, recovery code or a verification code sent by the realm.
export const codeSchema = z.string().trim().min(1).max(64);
export const idSchema = z.string().min(1).max(1024);

// The WebAuthn responses are verified by the WebAuthn library; only their outline is validated here, plus the user
// handle, which a passkey login looks the account up with before anything is verified.
export const webauthnResponseSchema = z.looseObject({
    id: idSchema,
    rawId: z.string(),
    response: z.looseObject({ userHandle: z.string().max(128).optional() }),
    type: z.literal('public-key'),
});

export const secondFactorProofSchema = z.discriminatedUnion(
    'factor',
    [
        z.object({
            code: codeSchema,
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
        createdAt: new EnhancedDate(session.createdAt).toISOString(),
        current: session.id === currentSessionId,
        factors: session.factors,
        id: session.id,
        ip: session.ip,
        lastActiveAt: new EnhancedDate(session.lastActiveAt).toISOString(),
        userAgent: session.userAgent,
    };
}
