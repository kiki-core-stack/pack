import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';

import { delay } from 'es-toolkit';
import { Hono } from 'hono';
import {
    describe,
    it,
} from 'vitest';

import {
    cookieSession,
    createCookieTokenHandler,
    createHeaderTokenHandler,
} from '../../../src/hono-backend/middlewares/cookie-session';
import type { CookieSessionOptions } from '../../../src/hono-backend/types/cookie-session';

declare module '../../../src/hono-backend/types/cookie-session' {
    interface CookieSessionData {
        count?: number;
        state?: string;
    }
}

// Functions
const createKey = () => randomBytes(32).toString('base64');

function createApp(options: Partial<CookieSessionOptions> = {}) {
    const app = new Hono();
    app.use(
        cookieSession({
            keys: createKey(),
            tokenHandler: createCookieTokenHandler(),
            ...options,
        }),
    );

    app.get('/read', (ctx) => ctx.json(ctx.cookieSession));
    app.get(
        '/set',
        (ctx) => {
            ctx.cookieSession.state = ctx.req.query('state');
            return ctx.text('ok');
        },
    );

    app.get(
        '/pop',
        (ctx) => ctx.json({
            popped: ctx.popCookieSession('state'),
            rest: ctx.cookieSession,
        }),
    );

    app.get(
        '/clear',
        (ctx) => {
            ctx.clearCookieSession();
            return ctx.text('ok');
        },
    );

    return app;
}

const getToken = (response: Response) => /^__Host-session=([^;]*)/.exec(response.headers.get('set-cookie') ?? '')?.[1];
const withToken = (token?: string): RequestInit => ({ headers: token ? { cookie: `__Host-session=${token}` } : {} });

// Tests
describe.concurrent('cookie session', () => {
    it('should store data in an encrypted cookie and read it back', async ({ expect }) => {
        const app = createApp();
        const response = await app.request('/set?state=abc');
        const token = getToken(response);

        expect(token).toBeDefined();
        expect(token).not.toContain('abc');
        expect(response.headers.get('set-cookie')).toMatch(/HttpOnly.*SameSite=Strict|SameSite=Strict.*HttpOnly/);
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(await (await app.request('/read', withToken(token))).json()).toStrictEqual({ state: 'abc' });
    });

    it('should not set a cookie when nothing changed', async ({ expect }) => {
        const response = await createApp().request('/read');

        expect(response.headers.get('set-cookie')).toBeNull();
    });

    it('should drop tampered, foreign-key and expired tokens', async ({ expect }) => {
        const token = getToken(await createApp({ keys: 'a'.repeat(43).concat('=') }).request('/set?state=abc'))!;
        const app = createApp();
        const tampered = `${token.slice(0, -4)}AAAA`;

        for (const candidate of [
            tampered,
            token,
        ]) {
            const response = await app.request('/read', withToken(candidate));
            expect(await response.json()).toStrictEqual({});
            expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
        }

        const keys = createKey();
        const expiringApp = createApp({
            keys,
            maxAge: 1,
        });

        const expiredToken = getToken(await expiringApp.request('/set?state=abc'));
        await delay(1100);
        expect(await (await expiringApp.request('/read', withToken(expiredToken))).json()).toStrictEqual({});
    });

    it('should decrypt with old keys and encrypt with the first key', async ({ expect }) => {
        const [oldKey, newKey] = [
            createKey(),
            createKey(),
        ];

        const oldToken = getToken(await createApp({ keys: oldKey }).request('/set?state=abc'));
        const rotatedApp = createApp({
            keys: [
                newKey,
                oldKey,
            ],
        });

        expect(await (await rotatedApp.request('/read', withToken(oldToken))).json()).toStrictEqual({ state: 'abc' });
        const newToken = getToken(await rotatedApp.request('/set?state=def'));
        expect(await (await createApp({ keys: newKey }).request('/read', withToken(newToken))).json())
            .toStrictEqual({ state: 'def' });
    });

    it('should accept comma-separated key strings', async ({ expect }) => {
        const [oldKey, newKey] = [
            createKey(),
            createKey(),
        ];

        const oldToken = getToken(await createApp({ keys: oldKey }).request('/set?state=abc'));
        const app = createApp({ keys: ` ${newKey} , ${oldKey},` });

        expect(await (await app.request('/read', withToken(oldToken))).json()).toStrictEqual({ state: 'abc' });
        expect(() => cookieSession({
            keys: ' , ',
            tokenHandler: createCookieTokenHandler(),
        })).toThrow('At least one');
    });

    it('should pop values and persist the removal', async ({ expect }) => {
        const app = createApp();
        const token = getToken(await app.request('/set?state=abc'));
        const response = await app.request('/pop', withToken(token));

        expect(await response.json()).toStrictEqual({
            popped: 'abc',
            rest: {},
        });

        expect(await (await app.request('/read', withToken(getToken(response)))).json()).toStrictEqual({});
    });

    it('should clear the cookie only when one was sent', async ({ expect }) => {
        const app = createApp();
        const token = getToken(await app.request('/set?state=abc'));

        expect((await app.request('/clear', withToken(token))).headers.get('set-cookie')).toContain('Max-Age=0');
        expect((await app.request('/clear')).headers.get('set-cookie')).toBeNull();
    });

    it('should reject oversized data and invalid keys', async ({ expect }) => {
        const app = createApp({ maxTokenLength: 100 });
        const response = await app.request(`/set?state=${'x'.repeat(200)}`);

        expect(response.status).toBe(500);
        expect(() => cookieSession({
            keys: Buffer.from('short').toString('base64'),
            tokenHandler: createCookieTokenHandler(),
        })).toThrow('32-byte');

        expect(() => cookieSession({
            keys: [],
            tokenHandler: createCookieTokenHandler(),
        })).toThrow('At least one');
    });

    it('should support header token handlers', async ({ expect }) => {
        const app = createApp({ tokenHandler: createHeaderTokenHandler() });
        const response = await app.request('/set?state=abc');
        const token = response.headers.get('set-session')!;

        expect(token).toBeTruthy();
        expect(await (await app.request('/read', { headers: { session: token } })).json())
            .toStrictEqual({ state: 'abc' });
    });
});
