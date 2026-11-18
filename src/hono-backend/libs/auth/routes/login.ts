import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import type { Context } from 'hono';
import { createFactory } from 'hono/factory';

import { AuthEventType } from '../../../../constants/auth';
import { recordAuthEvent } from '../../../../libs/auth/event';
import {
    completeAuthSecondFactorLogin,
    getAuthSecondFactorChallengePrincipalId,
    loginWithAuthPasskey,
    loginWithAuthPassword,
} from '../../../../libs/auth/login';
import type { AuthLoginOutcome } from '../../../../libs/auth/login';
import { createAuthPasskeyAuthenticationOptions } from '../../../../libs/auth/passkey';
import { findAuthPrincipalSetting } from '../../../../libs/auth/principal-setting';
import { consumeAuthAttempt } from '../../../../libs/auth/rate-limit';
import { revokeAuthSession } from '../../../../libs/auth/session';
import * as z from '../../../../libs/zod/backend';
import type { AuthPrincipal } from '../../../../types/auth';
import { apiValidator } from '../../api/validator';
import {
    applyAuthLoginOutcome,
    createApiSuccessResponse,
    deleteAuthSessionCookie,
} from '../_internals/context';
import {
    accountSchema,
    defineAuthRoute,
    idSchema,
    secondFactorProofSchema,
    webauthnResponseSchema,
} from '../_internals/route';
import type { AuthRoutesContext } from '../_internals/route';

// Constants
const { createHandlers } = createFactory();

// Functions
export function createAuthLoginRoutes<P extends AuthPrincipal>({ getRequest, realm }: AuthRoutesContext<P>) {
    async function respondLoginOutcome(ctx: Context, outcome: AuthLoginOutcome) {
        return createApiSuccessResponse(ctx, await applyAuthLoginOutcome(ctx, realm, outcome));
    }

    return {
        getPasskeyOptions: defineAuthRoute(
            { noLoginRequired: true },
            async (ctx: Context) => {
                await consumeAuthAttempt(realm.name, 'unauthenticatedChallengeByIp', getRequest(ctx).ip ?? '');
                return createApiSuccessResponse(ctx, await createAuthPasskeyAuthenticationOptions(realm, 'login'));
            },
        ),
        getSecondFactorPasskeyOptions: defineAuthRoute(
            { noLoginRequired: true },
            ...createHandlers(
                apiValidator('json', z.object({ challengeId: idSchema })),
                async (ctx) => {
                    const principalId = await getAuthSecondFactorChallengePrincipalId(
                        realm,
                        ctx.req.valid('json').challengeId,
                    );

                    return createApiSuccessResponse(
                        ctx,
                        await createAuthPasskeyAuthenticationOptions(
                            realm,
                            'secondFactor',
                            await findAuthPrincipalSetting(realm, principalId),
                        ),
                    );
                },
            ),
        ),
        passkey: defineAuthRoute(
            { noLoginRequired: true },
            ...createHandlers(
                apiValidator(
                    'json',
                    z.object({
                        challengeId: idSchema,
                        response: webauthnResponseSchema,
                    }),
                ),
                async (ctx) => {
                    const data = ctx.req.valid('json');
                    return await respondLoginOutcome(
                        ctx,
                        await loginWithAuthPasskey(
                            realm,
                            data.challengeId,
                            data.response as unknown as AuthenticationResponseJSON,
                            getRequest(ctx),
                        ),
                    );
                },
            ),
        ),
        password: defineAuthRoute(
            { noLoginRequired: true },
            ...createHandlers(
                apiValidator(
                    'json',
                    z.object({
                        account: accountSchema,
                        password: z.string().min(1).max(1024),
                    }),
                ),
                async (ctx) => {
                    const data = ctx.req.valid('json');
                    return await respondLoginOutcome(
                        ctx,
                        await loginWithAuthPassword(realm, data.account, data.password, getRequest(ctx)),
                    );
                },
            ),
        ),
        secondFactor: defineAuthRoute(
            { noLoginRequired: true },
            ...createHandlers(
                apiValidator(
                    'json',
                    z.object({
                        challengeId: idSchema,
                        proof: secondFactorProofSchema,
                    }),
                ),
                async (ctx) => {
                    const data = ctx.req.valid('json');
                    return await respondLoginOutcome(
                        ctx,
                        await completeAuthSecondFactorLogin(
                            realm,
                            data.challengeId,
                            data.proof as Parameters<typeof completeAuthSecondFactorLogin>[2],
                            getRequest(ctx),
                        ),
                    );
                },
            ),
        ),
    };
}

/**
 * Logs out: revokes the current session, if any, and clears the cookie.
 */
export function createAuthLogoutRoute<P extends AuthPrincipal>({ getRequest, realm }: AuthRoutesContext<P>) {
    return defineAuthRoute(
        { noLoginRequired: true },
        async (ctx: Context) => {
            const session = ctx.authSession;
            if (session) {
                await revokeAuthSession(realm, session.principalId, session.id);
                await recordAuthEvent(
                    realm,
                    {
                        principalId: session.principalId,
                        request: getRequest(ctx),
                        sessionId: session.id,
                        type: AuthEventType.Logout,
                    },
                );
            }

            deleteAuthSessionCookie(ctx, realm);
            return createApiSuccessResponse(ctx);
        },
    );
}
