import { createFactory } from 'hono/factory';

import {
    completeAuthPasswordReset,
    requestAuthPasswordReset,
} from '../../../../libs/auth/password';
import * as z from '../../../../libs/zod/backend';
import { strongPasswordSchema } from '../../../../schemas/password';
import type { AuthPrincipal } from '../../../../types/auth';
import { apiValidator } from '../../api/validator';
import { createApiSuccessResponse } from '../_internals/context';
import {
    accountSchema,
    defineAuthRoute,
    idSchema,
} from '../_internals/route';
import type { AuthRoutesContext } from '../_internals/route';

// Constants
const { createHandlers } = createFactory();

// Functions

/**
 * Resetting a forgotten password without logging in, for realms with a messenger: request a token for an account,
 * which the realm sends as a link to the frontend's reset page, then set the new password with it.
 */
export function createAuthPasswordResetRoutes<P extends AuthPrincipal>({ getRequest, realm }: AuthRoutesContext<P>) {
    return {
        complete: defineAuthRoute(
            { noLoginRequired: true },
            ...createHandlers(
                apiValidator(
                    'json',
                    z.object({
                        newPassword: realm.newPasswordSchema ?? strongPasswordSchema,
                        token: idSchema,
                    }),
                ),
                async (ctx) => {
                    const data = ctx.req.valid('json');
                    await completeAuthPasswordReset(realm, data.token, data.newPassword, getRequest(ctx));
                    return createApiSuccessResponse(ctx);
                },
            ),
        ),
        /**
         * Always succeeds, whether or not the account exists.
         */
        request: defineAuthRoute(
            { noLoginRequired: true },
            ...createHandlers(
                apiValidator('json', z.object({ account: accountSchema })),
                async (ctx) => {
                    await requestAuthPasswordReset(realm, ctx.req.valid('json').account, getRequest(ctx));
                    return createApiSuccessResponse(ctx);
                },
            ),
        ),
    };
}
