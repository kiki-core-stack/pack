import type { Context } from 'hono';
import { createFactory } from 'hono/factory';

import { createAuthPasskeyAuthenticationOptions } from '../../../../libs/auth/passkey';
import { findAuthPrincipalSetting } from '../../../../libs/auth/principal-setting';
import { createAuthVerificationGrant } from '../../../../libs/auth/verification';
import * as z from '../../../../libs/zod/backend';
import type { AuthPrincipal } from '../../../../types/auth';
import { apiValidator } from '../../api/validator';
import { createApiSuccessResponse } from '../_internals/context';
import {
    defineAuthRoute,
    secondFactorProofSchema,
} from '../_internals/route';
import type { AuthRoutesContext } from '../_internals/route';

// Constants
const { createHandlers } = createFactory();
const verificationProofSchema = z.discriminatedUnion(
    'factor',
    [
        ...secondFactorProofSchema.options,
        z.object({
            factor: z.literal('password'),
            password: z.string().min(1),
        }),
    ],
);

// Functions

/**
 * Verification of high-risk operations: proving a factor returns a one-time grant for the named operation.
 */
export function createAuthVerificationRoutes<P extends AuthPrincipal>({
    getRequest,
    getSession,
    realm,
}: AuthRoutesContext<P>) {
    return {
        create: defineAuthRoute(
            {},
            ...createHandlers(
                apiValidator(
                    'json',
                    z.object({
                        operation: z.string().min(1).max(256),
                        proof: verificationProofSchema,
                    }),
                ),
                async (ctx) => {
                    const data = ctx.req.valid('json');
                    return createApiSuccessResponse(
                        ctx,
                        {
                            grant: await createAuthVerificationGrant(
                                realm,
                                getSession(ctx),
                                data.operation,
                                data.proof as Parameters<typeof createAuthVerificationGrant>[3],
                                getRequest(ctx),
                            ),
                        },
                    );
                },
            ),
        ),
        getPasskeyOptions: defineAuthRoute(
            {},
            async (ctx: Context) => createApiSuccessResponse(
                ctx,
                await createAuthPasskeyAuthenticationOptions(
                    realm,
                    'verification',
                    await findAuthPrincipalSetting(realm, getSession(ctx).principalId),
                ),
            ),
        ),
    };
}
