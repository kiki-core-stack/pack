import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import type { Context } from 'hono';
import { createFactory } from 'hono/factory';

import {
    AuthEventType,
    authVerificationOperations,
} from '../../../../constants/auth';
import { recordAuthEvent } from '../../../../libs/auth/event';
import { createAuthPasskeyRegistrationOptions } from '../../../../libs/auth/passkey/server';
import { changeAuthPassword } from '../../../../libs/auth/password';
import {
    listAuthSessions,
    revokeAuthSession,
    revokeOtherAuthSessions,
    upgradeRestrictedAuthSession,
} from '../../../../libs/auth/session';
import {
    confirmAuthTotpSetup,
    getAuthSecurityOverview,
    regenerateAuthRecoveryCodes,
    registerAuthPasskey,
    removeAuthPasskey,
    removeAuthTotp,
    renameAuthPasskey,
    setAuthTwoFactorEnabled,
    startAuthTotpSetup,
} from '../../../../libs/auth/two-factor';
import * as z from '../../../../libs/zod/backend';
import { strongPasswordSchema } from '../../../../schemas/password';
import type {
    AuthFactor,
    AuthPrincipal,
} from '../../../../types/auth';
import * as apiErrors from '../../../api-errors';
import { throwApiError } from '../../api/error';
import { apiValidator } from '../../api/validator';
import {
    createApiSuccessResponse,
    deleteAuthSessionCookie,
    setAuthSessionCookie,
} from '../_internals/context';
import {
    defineAuthRoute,
    idSchema,
    toAuthSessionData,
    webauthnResponseSchema,
} from '../_internals/route';
import type { AuthRoutesContext } from '../_internals/route';

// Constants
const { createHandlers } = createFactory();
const passkeyNameSchema = z.string().trim().min(1).max(64);

// Functions

/**
 * The account's own security settings and sessions.
 */
export function createAuthSecurityRoutes<P extends AuthPrincipal>({
    assertVerification,
    getOperationContext,
    getPrincipal,
    getRequest,
    getSession,
    realm,
}: AuthRoutesContext<P>) {
    /**
     * Adding a factor needs a verification, except the first set-up within a restricted session.
     */
    async function assertAddFactorVerification(ctx: Context) {
        if (!getSession(ctx).restricted) await assertVerification(ctx, authVerificationOperations.addFactor);
    }

    /**
     * After a restricted session sets up its second factor, it is replaced with a normal session.
     */
    async function upgradeRestrictedSession(ctx: Context, factor: AuthFactor) {
        const session = getSession(ctx);
        if (!session.restricted) return;
        setAuthSessionCookie(ctx, realm, await upgradeRestrictedAuthSession(realm, session, factor, getRequest(ctx)));
    }

    return {
        changePassword: defineAuthRoute(
            {},
            ...createHandlers(
                apiValidator(
                    'json',
                    z.object({
                        currentPassword: z.string().min(1).max(1024).optional(),
                        newPassword: realm.newPasswordSchema ?? strongPasswordSchema,
                    }),
                ),
                async (ctx) => {
                    const session = getSession(ctx);
                    const data = ctx.req.valid('json');
                    await changeAuthPassword(
                        realm,
                        await getPrincipal(ctx),
                        session.id,
                        data.currentPassword,
                        data.newPassword,
                        getRequest(ctx),
                        async () => await assertVerification(ctx, authVerificationOperations.changePassword),
                    );

                    // Every session is revoked, this one included.
                    deleteAuthSessionCookie(ctx, realm);
                    return createApiSuccessResponse(ctx);
                },
            ),
        ),
        confirmTotpSetup: defineAuthRoute(
            { allowRestrictedSession: true },
            ...createHandlers(
                apiValidator(
                    'json',
                    z.object({
                        challengeId: idSchema,
                        code: z.string().trim().min(1).max(16),
                    }),
                ),
                async (ctx) => {
                    const data = ctx.req.valid('json');
                    const result = await confirmAuthTotpSetup(
                        realm,
                        getSession(ctx),
                        data.challengeId,
                        data.code,
                        getOperationContext(ctx),
                    );

                    await upgradeRestrictedSession(ctx, 'totp');
                    return createApiSuccessResponse(ctx, result);
                },
            ),
        ),
        getOverview: defineAuthRoute(
            { allowRestrictedSession: true },
            async (ctx: Context) => createApiSuccessResponse(
                ctx,
                await getAuthSecurityOverview(realm, getSession(ctx).principalId, { forSelf: true }),
            ),
        ),
        getPasskeyRegistrationOptions: defineAuthRoute(
            { allowRestrictedSession: true },
            async (ctx: Context) => {
                await assertAddFactorVerification(ctx);
                return createApiSuccessResponse(
                    ctx,
                    await createAuthPasskeyRegistrationOptions(realm, await getPrincipal(ctx), getSession(ctx).id),
                );
            },
        ),
        listSessions: defineAuthRoute(
            {},
            async (ctx: Context) => {
                const session = getSession(ctx);
                const sessions = await listAuthSessions(realm, session.principalId);
                return createApiSuccessResponse(
                    ctx,
                    {
                        count: sessions.length,
                        list: sessions.map((item) => toAuthSessionData(item, session.id)),
                    },
                );
            },
        ),
        regenerateRecoveryCodes: defineAuthRoute(
            { verification: authVerificationOperations.regenerateRecoveryCodes },
            async (ctx: Context) => createApiSuccessResponse(
                ctx,
                {
                    recoveryCodes: await regenerateAuthRecoveryCodes(
                        realm,
                        getSession(ctx).principalId,
                        getOperationContext(ctx),
                    ),
                },
            ),
        ),
        registerPasskey: defineAuthRoute(
            { allowRestrictedSession: true },
            ...createHandlers(
                apiValidator(
                    'json',
                    z.object({
                        challengeId: idSchema,
                        name: passkeyNameSchema,
                        response: webauthnResponseSchema,
                    }),
                ),
                async (ctx) => {
                    const data = ctx.req.valid('json');
                    const result = await registerAuthPasskey(
                        realm,
                        getSession(ctx),
                        data.challengeId,
                        data.response as unknown as RegistrationResponseJSON,
                        data.name,
                        getOperationContext(ctx),
                    );

                    await upgradeRestrictedSession(ctx, 'passkey');
                    return createApiSuccessResponse(ctx, result);
                },
            ),
        ),
        /**
         * Expects the route param `id`: the passkey's credential ID.
         */
        removePasskey: defineAuthRoute(
            { verification: authVerificationOperations.removeFactor },
            async (ctx: Context) => {
                const removed = await removeAuthPasskey(
                    realm,
                    getSession(ctx).principalId,
                    ctx.req.param('id') ?? '',
                    getOperationContext(ctx),
                );

                if (!removed) throwApiError(apiErrors.common.notFound);
                return createApiSuccessResponse(ctx);
            },
        ),
        removeTotp: defineAuthRoute(
            { verification: authVerificationOperations.removeFactor },
            async (ctx: Context) => {
                if (!await removeAuthTotp(realm, getSession(ctx).principalId, getOperationContext(ctx))) {
                    throwApiError(apiErrors.common.notFound);
                }

                return createApiSuccessResponse(ctx);
            },
        ),
        /**
         * Expects the route param `id`: the passkey's credential ID.
         */
        renamePasskey: defineAuthRoute(
            {},
            ...createHandlers(
                apiValidator('json', z.object({ name: passkeyNameSchema })),
                async (ctx) => {
                    const renamed = await renameAuthPasskey(
                        realm,
                        getSession(ctx).principalId,
                        ctx.req.param('id') ?? '',
                        ctx.req.valid('json').name,
                    );

                    if (!renamed) throwApiError(apiErrors.common.notFound);
                    return createApiSuccessResponse(ctx);
                },
            ),
        ),
        revokeOtherSessions: defineAuthRoute(
            {},
            async (ctx: Context) => {
                await revokeOtherAuthSessions(realm, getSession(ctx), getRequest(ctx));
                return createApiSuccessResponse(ctx);
            },
        ),
        /**
         * Expects the route param `id`: the session ID.
         */
        revokeSession: defineAuthRoute(
            {},
            async (ctx: Context) => {
                const session = getSession(ctx);
                const sessionId = ctx.req.param('id') ?? '';
                if (!await revokeAuthSession(realm, session.principalId, sessionId)) {
                    throwApiError(apiErrors.common.notFound);
                }

                await recordAuthEvent(
                    realm,
                    {
                        ...getOperationContext(ctx),
                        metadata: { revokedSessionId: sessionId },
                        principalId: session.principalId,
                        type: AuthEventType.SessionRevoked,
                    },
                );

                if (sessionId === session.id) deleteAuthSessionCookie(ctx, realm);
                return createApiSuccessResponse(ctx);
            },
        ),
        setTwoFactorEnabled: defineAuthRoute(
            {},
            ...createHandlers(
                apiValidator('json', z.object({ enabled: z.boolean() })),
                async (ctx) => {
                    const { enabled } = ctx.req.valid('json');
                    if (!enabled) await assertVerification(ctx, authVerificationOperations.disableTwoFactor);
                    await setAuthTwoFactorEnabled(
                        realm,
                        getSession(ctx).principalId,
                        enabled,
                        getOperationContext(ctx),
                    );

                    return createApiSuccessResponse(ctx);
                },
            ),
        ),
        startTotpSetup: defineAuthRoute(
            { allowRestrictedSession: true },
            async (ctx: Context) => {
                await assertAddFactorVerification(ctx);
                return createApiSuccessResponse(
                    ctx,
                    await startAuthTotpSetup(realm, await getPrincipal(ctx), getSession(ctx).id),
                );
            },
        ),
    };
}
