import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { PlatformScope } from '../constants/platform';
import * as z from '../libs/zod';

/**
 * Auth policy of a realm, kept in the platform config of the realm's scope (see `docs/auth.md`).
 */
export const platformAuthConfigSchema = z.object({
    maxSessions: z.int().min(1).max(100).nullable(),
    qrCodeLoginApprovalRequiresVerification: z.boolean(),
    qrCodeLoginEnabled: z.boolean(),
    session: z
        .object({
            absoluteTimeoutSeconds: z.int().min(300).max(31536000),
            idleTimeoutSeconds: z.int().min(60).max(31536000),
        })
        .refine(
            (session) => session.idleTimeoutSeconds <= session.absoluteTimeoutSeconds,
            z.i18nIssue({
                'en': 'The idle timeout cannot exceed the login validity period',
                'zh-TW': '閒置逾時不可超過登入有效期限',
            }),
        ),
    twoFactorRequired: z.boolean(),
});

/**
 * Platform configs by `scope`. The scope is fixed on each stored config, so configs are validated with
 * `platformConfigVariants.parse(scope, config)`.
 */
export const platformConfigVariants = z.discriminatedMap(
    'scope',
    'config',
    {
        [PlatformScope.AdminManagement]: z.object({ auth: platformAuthConfigSchema }),
        [PlatformScope.System]: z.object({ ipAccessPolicy: z.object({ enabled: z.boolean() }) }),
    } satisfies ReadonlyRecord<PlatformScope, z.ZodType>,
);
