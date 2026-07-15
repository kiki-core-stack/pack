import { Hono } from 'hono';
import {
    describe,
    it,
    vi,
} from 'vitest';
import type { ExpectStatic } from 'vitest';

import { createHonoAuthenticationSession } from '../../../src/hono-backend/libs/authentication-session';
import type { HonoAuthenticationSessionOptions } from '../../../src/hono-backend/libs/authentication-session';
import type { AuthenticationSessionData } from '../../../src/types/data/authentication-session';

const session: AuthenticationSessionData = {
    absoluteExpiresAt: 30_000,
    epoch: 'epoch',
    id: 'selector',
    lastActiveAt: 10_000,
    lastActiveIp: '127.0.0.1',
    loggedAt: 9_000,
    loginIp: '127.0.0.1',
    principalId: 'admin-id',
    principalType: 'admin',
};

function createStore(
    overrides: Partial<HonoAuthenticationSessionOptions['store']> = {},
): HonoAuthenticationSessionOptions['store'] {
    return {
        authenticate: vi.fn().mockResolvedValue(undefined),
        create: vi.fn().mockResolvedValue({
            session,
            token: 'created-token',
            ttlSeconds: 600,
        }),
        rotate: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

function expectSecureHostCookie(expect: ExpectStatic, value: null | string, token: string, maxAge: number): void {
    expect(value).toContain(`__Host-admin-session=${token}`);
    expect(value).toContain(`Max-Age=${maxAge}`);
    expect(value).toContain('Path=/');
    expect(value).toContain('HttpOnly');
    expect(value).toContain('Secure');
    expect(value).toContain('SameSite=Strict');
}

describe.concurrent('hono authentication session', () => {
    it('does not call the store when the request has no session cookie', async ({ expect }) => {
        const store = createStore();
        const authenticationSession = createHonoAuthenticationSession({
            cookieName: 'admin-session',
            store,
        });

        const app = new Hono()
            .get(
                '/',
                async (ctx) => {
                    const session = await authenticationSession.authenticate(ctx, { ip: '127.0.0.1' });
                    return ctx.json({ session });
                },
            )
            .post(
                '/rotate',
                async (ctx) => ctx.json({
                    session: await authenticationSession.rotate(ctx, {
                        ip: '127.0.0.1',
                        principalId: 'admin-id',
                    }),
                }),
            );

        const [authenticateResponse, rotateResponse] = await Promise.all([
            app.request('/'),
            app.request('/rotate', { method: 'POST' }),
        ]);

        await expect(authenticateResponse.json()).resolves.toEqual({});
        await expect(rotateResponse.json()).resolves.toEqual({});
        expect(store.authenticate).not.toHaveBeenCalled();
        expect(store.rotate).not.toHaveBeenCalled();
    });

    it('creates a session and writes its token as a secure host cookie', async ({ expect }) => {
        const store = createStore();
        const authenticationSession = createHonoAuthenticationSession({
            cookieName: 'admin-session',
            store,
        });

        const app = new Hono().post(
            '/',
            async (ctx) => ctx.json(
                await authenticationSession.create(
                    ctx,
                    {
                        ip: '127.0.0.1',
                        principalId: 'admin-id',
                    },
                ),
            ),
        );

        const response = await app.request('/', { method: 'POST' });

        await expect(response.json()).resolves.toEqual(session);
        expectSecureHostCookie(expect, response.headers.get('set-cookie'), 'created-token', 600);
        expect(response.headers.get('cache-control')).toBe('no-store');
    });

    it('authenticates from the host cookie and refreshes it only after a touch', async ({ expect }) => {
        const authenticate = vi.fn().mockResolvedValue({
            refreshedTtlSeconds: 500,
            session,
        });

        const authenticationSession = createHonoAuthenticationSession({
            cookieName: 'admin-session',
            store: createStore({ authenticate }),
        });

        const app = new Hono().get(
            '/',
            async (ctx) => {
                const authenticated = await authenticationSession.authenticate(ctx, { ip: '127.0.0.2' });
                return ctx.json(authenticated);
            },
        );

        const response = await app.request('/', { headers: { cookie: '__Host-admin-session=current-token' } });

        expect(authenticate).toHaveBeenCalledWith({
            ip: '127.0.0.2',
            token: 'current-token',
        });

        await expect(response.json()).resolves.toEqual(session);
        expectSecureHostCookie(expect, response.headers.get('set-cookie'), 'current-token', 500);
        expect(response.headers.get('cache-control')).toBe('no-store');
    });

    it('does not rewrite the cookie when authentication does not touch the session', async ({ expect }) => {
        const authenticationSession = createHonoAuthenticationSession({
            cookieName: 'admin-session',
            store: createStore({ authenticate: vi.fn().mockResolvedValue({ session }) }),
        });

        const app = new Hono().get(
            '/',
            async (ctx) => {
                const authenticated = await authenticationSession.authenticate(ctx, { ip: '127.0.0.1' });
                return ctx.json(authenticated);
            },
        );

        const response = await app.request('/', { headers: { cookie: '__Host-admin-session=current-token' } });

        await expect(response.json()).resolves.toEqual(session);
        expect(response.headers.get('set-cookie')).toBeNull();
        expect(response.headers.get('cache-control')).toBe('no-store');
    });

    it('does not delete a possibly superseded cookie after invalid authentication', async ({ expect }) => {
        const authenticationSession = createHonoAuthenticationSession({
            cookieName: 'admin-session',
            store: createStore(),
        });

        const app = new Hono()
            .get(
                '/',
                async (ctx) => {
                    const authenticated = await authenticationSession.authenticate(ctx, { ip: '127.0.0.1' });
                    return ctx.json({ session: authenticated });
                },
            )
            .post(
                '/rotate',
                async (ctx) => ctx.json({
                    session: await authenticationSession.rotate(ctx, {
                        ip: '127.0.0.1',
                        principalId: 'admin-id',
                    }),
                }),
            );

        const response = await app.request('/', { headers: { cookie: '__Host-admin-session=invalid-token' } });

        await expect(response.json()).resolves.toEqual({});
        expect(response.headers.get('set-cookie')).toBeNull();
        expect(response.headers.get('cache-control')).toBeNull();

        const rotateResponse = await app.request(
            '/rotate',
            {
                headers: { cookie: '__Host-admin-session=invalid-token' },
                method: 'POST',
            },
        );

        await expect(rotateResponse.json()).resolves.toEqual({});
        expect(rotateResponse.headers.get('set-cookie')).toBeNull();
        expect(rotateResponse.headers.get('cache-control')).toBeNull();
    });

    it('rotates the cookie token and exposes an explicit cookie deletion operation', async ({ expect }) => {
        const rotate = vi.fn().mockResolvedValue({
            session,
            token: 'rotated-token',
            ttlSeconds: 400,
        });

        const authenticationSession = createHonoAuthenticationSession({
            cookieName: 'admin-session',
            store: createStore({ rotate }),
        });

        const app = new Hono()
            .post(
                '/rotate',
                async (ctx) => ctx.json(await authenticationSession.rotate(ctx, {
                    ip: '127.0.0.2',
                    principalId: 'admin-id',
                })),
            )
            .delete(
                '/',
                (ctx) => {
                    authenticationSession.deleteCookie(ctx);
                    return ctx.body(null, 204);
                },
            );

        const rotatedResponse = await app.request(
            '/rotate',
            {
                headers: { cookie: '__Host-admin-session=current-token' },
                method: 'POST',
            },
        );

        expect(rotate).toHaveBeenCalledWith({
            ip: '127.0.0.2',
            principalId: 'admin-id',
            token: 'current-token',
        });

        await expect(rotatedResponse.json()).resolves.toEqual(session);
        expectSecureHostCookie(expect, rotatedResponse.headers.get('set-cookie'), 'rotated-token', 400);
        expect(rotatedResponse.headers.get('cache-control')).toBe('no-store');

        const deletedResponse = await app.request(
            '/',
            {
                headers: { cookie: '__Host-admin-session=current-token' },
                method: 'DELETE',
            },
        );

        expect(deletedResponse.headers.get('set-cookie')).toContain('__Host-admin-session=; Max-Age=0; Path=/; Secure');
        expect(deletedResponse.headers.get('cache-control')).toBe('no-store');
    });
});
