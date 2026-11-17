import type { Context } from 'hono';

import type { AuthRealm } from '../../../../libs/auth/realm';
import type { AuthPrincipal } from '../../../../types/auth';
import type { HonoAuthOptions } from '../../../types/auth';
import { createAuthRoutesContext } from '../_internals/route';

import {
    createAuthLoginRoutes,
    createAuthLogoutRoute,
} from './login';
import { createAuthQrCodeLoginRoutes } from './qr-code-login';
import { createAuthSecurityRoutes } from './security';
import { createAuthVerificationRoutes } from './verification';

// Functions

/**
 * The self-service routes of a realm, by group: login, logout, QR code login, the account's own security settings
 * and sessions, and the verification of high-risk operations. See `docs/auth.md` for the flows.
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
        qrCodeLogin: createAuthQrCodeLoginRoutes(context),
        security: createAuthSecurityRoutes(context),
        verification: createAuthVerificationRoutes(context),
    };
}
