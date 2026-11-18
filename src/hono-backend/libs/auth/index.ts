import type { Context } from 'hono';

import { authVerificationHeaderName } from '../../../constants/auth';
import { assertAuthIpAccess } from '../../../libs/auth/access';
import { AuthError } from '../../../libs/auth/error';
import { loginWithAuthExternalIdentity } from '../../../libs/auth/login';
import type { AuthRealm } from '../../../libs/auth/realm';
import {
    authenticateAuthSession,
    touchAuthSession,
} from '../../../libs/auth/session';
import { consumeAuthVerificationGrant } from '../../../libs/auth/verification';
import type {
    AuthPrincipal,
    AuthSession,
} from '../../../types/auth';
import type {
    AuthRouteMeta,
    HonoAuthOptions,
} from '../../types/auth';

import {
    applyAuthLoginOutcome,
    deleteAuthSessionCookie,
    getAuthRequestInfo,
    getAuthSessionToken,
} from './_internals/context';
import { createAuthRoutes } from './routes';
import { createAuthManagementRoutes } from './routes/management';
import type { AuthManagementRoutesOptions } from './routes/management';

export type HonoAuth<P extends AuthPrincipal = AuthPrincipal> = ReturnType<typeof createHonoAuth<P>>;

// Constants
const safeHttpMethods = new Set([
    'GET',
    'HEAD',
    'OPTIONS',
]);

// Functions

/**
 * Hono bindings of an auth realm: request authentication, the self-service routes and the management routes.
 * Backends forward the routes from their own route files and call `authenticate` in a route middleware.
 */
export function createHonoAuth<P extends AuthPrincipal>(realm: AuthRealm<P>, options: HonoAuthOptions) {
    /**
     * Consumes the one-time verification grant of a high-risk operation from the `X-Auth-Verification` header.
     */
    async function assertVerification(ctx: Context, operation: string) {
        if (!ctx.authSession) throw new AuthError('unauthorized');
        await consumeAuthVerificationGrant(
            realm,
            ctx.authSession,
            operation,
            ctx.req.header(authVerificationHeaderName),
        );
    }

    /**
     * Authenticates the request and enforces the route's auth requirements; sets `ctx.authSession`.
     *
     * In order: session (secret, generation, timeouts), principal still active (re-checked about every 60 seconds),
     * restricted session still needed (the account has no second factor yet),
     * `Origin` of write requests, IP access policy, restricted session, verification grant, and only then the idle
     * timeout is extended, so rejected requests never extend a session.
     */
    async function authenticate(ctx: Context, meta: AuthRouteMeta = {}) {
        const request = getAuthRequestInfo(ctx, options);
        const token = getAuthSessionToken(ctx, realm);
        let session: AuthSession | undefined;
        if (token) {
            session = await authenticateAuthSession(realm, token);
            if (!session) deleteAuthSessionCookie(ctx, realm);
        }

        // Sibling entrances under the same registrable domain are same-site, so SameSite cookies do not stop them.
        if (!safeHttpMethods.has(ctx.req.method) && !realm.origins.includes(ctx.req.header('origin') ?? '')) {
            throw new AuthError('originNotAllowed');
        }

        await assertAuthIpAccess(realm, request, session?.principalId);
        if (!session) {
            if (meta.noLoginRequired) return;
            throw new AuthError(token ? 'sessionInvalid' : 'unauthorized');
        }

        ctx.authSession = session;
        if (!meta.noLoginRequired && session.restricted && !meta.allowRestrictedSession) {
            throw new AuthError('secondFactorSetupRequired');
        }

        if (meta.verification) {
            await assertVerification(
                ctx,
                typeof meta.verification === 'string' ? meta.verification : meta.verification(ctx),
            );
        }

        await touchAuthSession(realm, session);
    }

    /**
     * Logs in an account whose identity the backend has verified by other means (e.g. OAuth), in place of the
     * password step: sets the session cookie, or returns the second factor challenge when one is needed.
     */
    async function loginWithExternalIdentity(ctx: Context, principalId: string) {
        return await applyAuthLoginOutcome(
            ctx,
            realm,
            await loginWithAuthExternalIdentity(realm, principalId, getAuthRequestInfo(ctx, options)),
        );
    }

    return {
        assertVerification,
        authenticate,
        /**
         * Routes for managing the accounts of this realm by an authorized actor, who may belong to another realm.
         * "Who may manage whom" is decided by the backend's own route permissions and data scope.
         */
        createManagementRoutes: (managementOptions: AuthManagementRoutesOptions) => createAuthManagementRoutes(
            realm,
            options,
            managementOptions,
        ),
        loginWithExternalIdentity,
        realm,
        routes: createAuthRoutes(realm, options, assertVerification),
    };
}
