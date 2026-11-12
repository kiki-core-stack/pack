import type { Context } from 'hono';
import type { Arrayable } from 'type-fest';

export type PartialCookieSessionData = Partial<CookieSessionData>;

/**
 * Data kept in the cookie session. Extend it with declaration merging:
 *
 * ```ts
 * declare module '@kcs-project/pack/hono-backend/types/cookie-session' {
 *     interface CookieSessionData { oauth2AuthorizeState?: string }
 * }
 * ```
 */
export interface CookieSessionData {}

export interface CookieSessionOptions {
    /**
     * Base64-encoded 32-byte AES-256 keys: one key, an array, or a comma-separated string. The first encrypts; all are
     * tried to decrypt, so keys can be rotated by adding a new first key and removing the old ones later.
     */
    keys: Arrayable<string>;

    /**
     * Lifetime in seconds, renewed whenever the data changes.
     *
     * @defaultValue 86400
     */
    maxAge?: number;

    /**
     * Max encoded token length. Browsers silently drop cookies above about 4 KB, so exceeding it throws.
     *
     * @defaultValue 3800
     */
    maxTokenLength?: number;
    tokenHandler: CookieSessionTokenHandler;
}

export interface CookieSessionTokenHandler {
    delete: (ctx: Context) => void;
    get: (ctx: Context) => string | undefined;
    set: (ctx: Context, token: string, maxAgeSeconds: number) => void;
}
