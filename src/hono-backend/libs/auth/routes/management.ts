import type { Context } from 'hono';
import { createFactory } from 'hono/factory';
import type { Promisable } from 'type-fest';

import {
    AuthEventType,
    authVerificationOperations,
} from '../../../../constants/auth';
import { recordAuthEvent } from '../../../../libs/auth/event';
import type { AuthRealm } from '../../../../libs/auth/realm';
import {
    listAuthSessions,
    revokeAllAuthSessions,
    revokeAuthSession,
} from '../../../../libs/auth/session';
import {
    getAuthSecurityOverview,
    resetAuthTwoFactor,
    setAuthTwoFactorEnforced,
} from '../../../../libs/auth/two-factor';
import type { AuthOperationContext } from '../../../../libs/auth/types';
import * as z from '../../../../libs/zod/backend';
import * as apiErrors from '../../../api-errors';
import type { HonoAuthOptions } from '../../../types/auth';
import { throwApiError } from '../../api/error';
import { apiValidator } from '../../api/validator';
import {
    createApiSuccessResponse,
    getAuthRequestInfo,
} from '../_internals/context';
import {
    defineAuthRoute,
    toAuthSessionData,
} from '../_internals/route';

export interface AuthManagementRoutesOptions {
    /**
     * Consumes the actor's verification grant, in the actor's own realm (`HonoAuth.assertVerification` of that realm).
     */
    assertActorVerification: (ctx: Context, operation: string) => Promise<void>;

    /**
     * The authenticated actor performing the operation, recorded in the auth events.
     */
    getActor: (ctx: Context) => { principalId: string; realm: string };

    /**
     * The managed account; throw (e.g. `notFound`) when the actor may not manage it.
     *
     * @defaultValue The route param `id`, which must exist in the realm's model.
     */
    getTargetPrincipalId?: (ctx: Context) => Promisable<string>;
}

// Constants
const { createHandlers } = createFactory();

// Functions

/**
 * Routes for managing the accounts of a realm: their sessions and two-factor state. The actor's authentication and
 * permission are checked by the backend's own middlewares before these handlers run. The target may be the
 * actor's own account: revoking all sessions then logs the actor out too.
 */
export function createAuthManagementRoutes(
    realm: AuthRealm<any>,
    options: HonoAuthOptions,
    managementOptions: AuthManagementRoutesOptions,
) {
    const getOperationContext = (ctx: Context): AuthOperationContext => ({
        actor: managementOptions.getActor(ctx),
        request: getAuthRequestInfo(ctx, options),
    });

    async function getTargetPrincipalId(ctx: Context) {
        if (managementOptions.getTargetPrincipalId) return await managementOptions.getTargetPrincipalId(ctx);
        const principalId = ctx.req.param('id') ?? '';
        if (!await realm.model.exists({ _id: principalId })) throwApiError(apiErrors.common.notFound);
        return principalId;
    }

    return {
        getSecurityOverview: defineAuthRoute(
            {},
            async (ctx: Context) => createApiSuccessResponse(
                ctx,
                await getAuthSecurityOverview(realm, await getTargetPrincipalId(ctx)),
            ),
        ),
        listSessions: defineAuthRoute(
            {},
            async (ctx: Context) => {
                const sessions = await listAuthSessions(realm, await getTargetPrincipalId(ctx));
                return createApiSuccessResponse(
                    ctx,
                    {
                        count: sessions.length,
                        list: sessions.map((session) => toAuthSessionData(session)),
                    },
                );
            },
        ),
        resetTwoFactor: defineAuthRoute(
            {},
            async (ctx: Context) => {
                // The target is resolved first, so an unmanageable target does not use up a verification grant.
                const principalId = await getTargetPrincipalId(ctx);
                await managementOptions.assertActorVerification(ctx, authVerificationOperations.manageTwoFactor);
                await resetAuthTwoFactor(realm, principalId, getOperationContext(ctx));
                return createApiSuccessResponse(ctx);
            },
        ),
        revokeAllSessions: defineAuthRoute(
            {},
            async (ctx: Context) => {
                const principalId = await getTargetPrincipalId(ctx);
                const sessionIds = await revokeAllAuthSessions(realm, principalId);
                await recordAuthEvent(
                    realm,
                    {
                        ...getOperationContext(ctx),
                        metadata: { count: sessionIds.length },
                        principalId,
                        type: AuthEventType.AllSessionsRevoked,
                    },
                );

                return createApiSuccessResponse(ctx);
            },
        ),
        /**
         * Expects the route param `sessionId`.
         */
        revokeSession: defineAuthRoute(
            {},
            async (ctx: Context) => {
                const principalId = await getTargetPrincipalId(ctx);
                const sessionId = ctx.req.param('sessionId') ?? '';
                if (!await revokeAuthSession(realm, principalId, sessionId)) throwApiError(apiErrors.common.notFound);
                await recordAuthEvent(
                    realm,
                    {
                        ...getOperationContext(ctx),
                        metadata: { revokedSessionId: sessionId },
                        principalId,
                        type: AuthEventType.SessionRevoked,
                    },
                );

                return createApiSuccessResponse(ctx);
            },
        ),
        setTwoFactorEnforced: defineAuthRoute(
            {},
            ...createHandlers(
                apiValidator('json', z.object({ enforced: z.boolean() })),
                async (ctx) => {
                    const { enforced } = ctx.req.valid('json');
                    const principalId = await getTargetPrincipalId(ctx);
                    // Only removing the enforcement weakens the account, so only that needs a verification.
                    if (!enforced) {
                        await managementOptions.assertActorVerification(
                            ctx,
                            authVerificationOperations.manageTwoFactor,
                        );
                    }

                    await setAuthTwoFactorEnforced(realm, principalId, enforced, getOperationContext(ctx));
                    return createApiSuccessResponse(ctx);
                },
            ),
        ),
    };
}
