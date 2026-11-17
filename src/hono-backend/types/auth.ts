import type {
    Context,
    MiddlewareHandler,
} from 'hono';

import type { AuthSession } from '../../types/auth';

declare module 'hono' {
    interface Context {
        /**
         * The authenticated session of the request, set by `HonoAuth.authenticate`. A restricted session is set too;
         * routes that require login reject it unless their meta allows it.
         */
        authSession?: AuthSession;
    }
}

/**
 * A route built by pack: backends only forward `handlers` and apply `meta` to their own route meta.
 */
export interface AuthRouteDefinition {
    handlers: MiddlewareHandler[];
    meta: AuthRouteMeta;
}

/**
 * Per-route auth requirements, read by `HonoAuth.authenticate`. Backends merge it into their route meta.
 */
export interface AuthRouteMeta {
    /**
     * Allows a restricted session (two-factor authentication required but not set up yet). Only for the routes that
     * set up a second factor.
     */
    allowRestrictedSession?: true;
    noLoginRequired?: true;

    /**
     * High-risk operation name: the request must carry a one-time verification grant for it in the
     * `X-Auth-Verification` header. A function can append the target, e.g. `deleteProject:<id>`.
     */
    verification?: ((ctx: Context) => string) | string;
}

export interface HonoAuthOptions {
    /**
     * Resolves the client IP through the backend's trusted proxies.
     */
    getClientIp: (ctx: Context) => string | undefined;
}
