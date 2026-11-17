import type { Context } from 'hono';
import { createFactory } from 'hono/factory';

import { authVerificationOperations } from '../../../../constants/auth';
import {
    createAuthQrCodeLogin,
    decideAuthQrCodeLogin,
    getAuthQrCodeLoginInfo,
    pollAuthQrCodeLogin,
} from '../../../../libs/auth/qr-code-login';
import * as z from '../../../../libs/zod/backend';
import type { AuthPrincipal } from '../../../../types/auth';
import { apiValidator } from '../../api/validator';
import {
    createApiSuccessResponse,
    replaceAuthSessionCookie,
} from '../_internals/context';
import {
    defineAuthRoute,
    idSchema,
} from '../_internals/route';
import type { AuthRoutesContext } from '../_internals/route';

// Constants
const { createHandlers } = createFactory();
const qrTokenValidator = apiValidator('json', z.object({ qrToken: idSchema }));

// Functions
export function createAuthQrCodeLoginRoutes<P extends AuthPrincipal>({
    assertVerification,
    getRequest,
    getSession,
    realm,
}: AuthRoutesContext<P>) {
    return {
        approve: defineAuthRoute(
            {},
            ...createHandlers(
                qrTokenValidator,
                async (ctx) => {
                    const { qrToken } = ctx.req.valid('json');
                    // The request is looked up first, so an expired QR code does not use up a verification grant.
                    await getAuthQrCodeLoginInfo(realm, qrToken);
                    if ((await realm.getConfig()).qrCodeLoginApprovalRequiresVerification) {
                        await assertVerification(ctx, authVerificationOperations.approveQrCodeLogin);
                    }

                    await decideAuthQrCodeLogin(realm, getSession(ctx), qrToken, true, getRequest(ctx));
                    return createApiSuccessResponse(ctx);
                },
            ),
        ),
        create: defineAuthRoute(
            { noLoginRequired: true },
            async (ctx: Context) => createApiSuccessResponse(ctx, await createAuthQrCodeLogin(realm, getRequest(ctx))),
        ),
        getInfo: defineAuthRoute(
            {},
            ...createHandlers(
                qrTokenValidator,
                async (ctx) => createApiSuccessResponse(
                    ctx,
                    {
                        ...await getAuthQrCodeLoginInfo(realm, ctx.req.valid('json').qrToken),
                        requiresVerification: (await realm.getConfig()).qrCodeLoginApprovalRequiresVerification,
                    },
                ),
            ),
        ),
        poll: defineAuthRoute(
            { noLoginRequired: true },
            ...createHandlers(
                apiValidator(
                    'json',
                    z.object({
                        pollSecret: idSchema,
                        qrToken: idSchema,
                    }),
                ),
                async (ctx) => {
                    const data = ctx.req.valid('json');
                    const outcome = await pollAuthQrCodeLogin(realm, data.qrToken, data.pollSecret, getRequest(ctx));
                    if (outcome.state === 'completed') await replaceAuthSessionCookie(ctx, realm, outcome.created);
                    return createApiSuccessResponse(ctx, { state: outcome.state });
                },
            ),
        ),
        reject: defineAuthRoute(
            {},
            ...createHandlers(
                qrTokenValidator,
                async (ctx) => {
                    await decideAuthQrCodeLogin(
                        realm,
                        getSession(ctx),
                        ctx.req.valid('json').qrToken,
                        false,
                        getRequest(ctx),
                    );

                    return createApiSuccessResponse(ctx);
                },
            ),
        ),
    };
}
