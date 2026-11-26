import type { Context } from 'hono';

import type { AuthRealm } from '../../../../libs/auth/realm';
import type { AuthPrincipal } from '../../../../libs/auth/types';
import type { HonoAuthOptions } from '../../../types/auth';
import { createAuthRoutesContext } from '../_internals/route';

import {
    createAuthLoginRoutes,
    createAuthLogoutRoute,
} from './login';
import { createAuthPasswordResetRoutes } from './password-reset';
import { createAuthQrCodeLoginRoutes } from './qr-code-login';
import { createAuthSecurityRoutes } from './security';
import { createAuthVerificationRoutes } from './verification';

// Functions

/**
 * See `docs/kcs/auth.md` for the flows.
 */
export function createAuthRoutes<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    options: HonoAuthOptions,
    assertVerification: (ctx: Context, operation: string) => Promise<void>,
) {
    const context = createAuthRoutesContext(realm, options, assertVerification);
    return {
        login: createAuthLoginRoutes(context),
        logout: createAuthLogoutRoute(context),
        passwordReset: createAuthPasswordResetRoutes(context),
        qrCodeLogin: createAuthQrCodeLoginRoutes(context),
        security: createAuthSecurityRoutes(context),
        verification: createAuthVerificationRoutes(context),
    };
}
