import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';

import { defaultLocale } from '../../constants/i18n';
import { resolveLocale } from '../../libs/i18n';
import type { Locale } from '../../types/i18n';

declare module 'hono' {
    interface ContextVariableMap {
        /**
         * Locale for messages sent to the client, from `Accept-Language` (see `resolveLocale`).
         */
        locale: Locale;
    }
}

// Functions

/**
 * The request's locale (`ctx.var.locale`), or the default locale when the `locale` middleware has not run.
 */
export function getRequestLocale(ctx: Context) {
    return ctx.get('locale') as Locale | undefined ?? defaultLocale;
}

/**
 * Sets `ctx.var.locale` from `Accept-Language`. Register it as the first app-level middleware, so error and 404
 * responses are localized too.
 */
export function locale() {
    return createMiddleware(async (ctx, next) => {
        ctx.set('locale', resolveLocale(ctx.req.header('accept-language')));
        await next();
    });
}
