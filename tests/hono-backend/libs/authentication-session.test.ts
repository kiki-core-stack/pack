import { Hono } from 'hono';
import {
    describe,
    it,
    vi,
} from 'vitest';
import type { ExpectStatic } from 'vitest';

import { createHonoAuthenticationSession } from '../../../src/hono-backend/libs/authentication-session';
import type { HonoAuthenticationSessionOptions } from '../../../src/hono-backend/libs/authentication-session';
import { createAuthenticationSessionData } from '../../libs/authentication-session/_fixtures';

// Constants
const session = createAuthenticationSessionData({ absoluteExpiresAt: 30_000 });

const validatePrincipal = () => Promise.resolve(true);

// Functions
function createStore(
    overrides: Partial<HonoAuthenticationSessionOptions['store']> = {},
): HonoAuthenticationSessionOptions['store'] {
    return {
        authenticate: vi.fn().mockResolvedValue(undefined),
        create: vi.fn().mockResolvedValue({
            cookieMaxAgeSeconds: 600,
            session,
            token: 'created-token',
        }),
        qrCodeLogin: {
            approve: vi.fn().mockResolvedValue(false),
            cancel: vi.fn().mockResolvedValue(false),
            complete: vi.fn().mockResolvedValue(undefined),
            create: vi.fn(),
            getApprovalRequest: vi.fn().mockResolvedValue(undefined),
        },
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

// Tests
describe.concurrent('hono authentication session', () => {
    it('does not call the store when the request has no session cookie', async ({ expect }) => {
        const store = createStore();
        const authenticationSession = createHonoAuthenticationSession({
            cookieName: 'admin-session',
            store,
            validatePrincipal,
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
            validatePrincipal,
        });

        const app = new Hono().post(
            '/',
            async (ctx) => ctx.json(
                await authenticationSession.create(
                    ctx,
                    {
                        ip: '127.0.0.1',
                        principalAuthenticationRevision: 3,
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

    it('authenticates from the host cookie without rewriting it after a touch', async ({ expect }) => {
        const validateContextPrincipal = vi.fn().mockResolvedValue(true);
        const authenticate = vi.fn(async (input) => {
            await input.validatePrincipal({
                principalAuthenticationRevision: 3,
                principalId: 'admin-id',
                principalType: 'admin',
            });

            return session;
        });

        const authenticationSession = createHonoAuthenticationSession({
            cookieName: 'admin-session',
            store: createStore({ authenticate }),
            validatePrincipal: validateContextPrincipal,
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
            validatePrincipal: expect.any(Function),
        });

        expect(validateContextPrincipal).toHaveBeenCalledWith(
            expect.anything(),
            {
                principalAuthenticationRevision: 3,
                principalId: 'admin-id',
                principalType: 'admin',
            },
        );

        await expect(response.json()).resolves.toEqual(session);
        expect(response.headers.get('set-cookie')).toBeNull();
        expect(response.headers.get('cache-control')).toBe('no-store');
    });

    it('does not delete a possibly superseded cookie after invalid authentication', async ({ expect }) => {
        const authenticationSession = createHonoAuthenticationSession({
            cookieName: 'admin-session',
            store: createStore(),
            validatePrincipal,
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
        const validateContextPrincipal = vi.fn().mockResolvedValue(true);
        const rotate = vi.fn(async (input) => {
            await input.validatePrincipal({
                principalAuthenticationRevision: 3,
                principalId: 'admin-id',
                principalType: 'admin',
            });

            return {
                cookieMaxAgeSeconds: 400,
                session,
                token: 'rotated-token',
            };
        });

        const authenticationSession = createHonoAuthenticationSession({
            cookieName: 'admin-session',
            store: createStore({ rotate }),
            validatePrincipal: validateContextPrincipal,
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
            validatePrincipal: expect.any(Function),
        });

        expect(validateContextPrincipal).toHaveBeenCalledWith(
            expect.anything(),
            {
                principalAuthenticationRevision: 3,
                principalId: 'admin-id',
                principalType: 'admin',
            },
        );

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

    it('completes an approved QR code login and writes the issued session cookie', async ({ expect }) => {
        const validateContextPrincipal = vi.fn().mockResolvedValue(true);
        const complete = vi.fn(async (input) => {
            await input.validatePrincipal({
                principalAuthenticationRevision: 3,
                principalId: 'admin-id',
                principalType: 'admin',
            });

            return {
                cookieMaxAgeSeconds: 500,
                session,
                state: 'completed' as const,
                token: 'qr-code-login-token',
            };
        });

        const store = createStore();
        store.qrCodeLogin.complete = complete;

        const authenticationSession = createHonoAuthenticationSession({
            cookieName: 'admin-session',
            store,
            validatePrincipal: validateContextPrincipal,
        });

        const app = new Hono().post(
            '/',
            async (ctx) => ctx.json(await authenticationSession.completeQrCodeLogin(
                ctx,
                {
                    completionToken: 'completion-token',
                    ip: '127.0.0.2',
                },
            )),
        );

        const response = await app.request('/', { method: 'POST' });

        expect(complete).toHaveBeenCalledWith({
            completionToken: 'completion-token',
            ip: '127.0.0.2',
            validatePrincipal: expect.any(Function),
        });

        expect(validateContextPrincipal).toHaveBeenCalledWith(
            expect.anything(),
            {
                principalAuthenticationRevision: 3,
                principalId: 'admin-id',
                principalType: 'admin',
            },
        );

        await expect(response.json()).resolves.toEqual({
            session,
            state: 'completed',
        });

        expectSecureHostCookie(expect, response.headers.get('set-cookie'), 'qr-code-login-token', 500);
        expect(response.headers.get('cache-control')).toBe('no-store');
    });

    it('prevents caching while a QR code login is pending', async ({ expect }) => {
        const store = createStore();
        store.qrCodeLogin.complete = vi.fn().mockResolvedValue({ state: 'pending' });

        const authenticationSession = createHonoAuthenticationSession({
            cookieName: 'admin-session',
            store,
            validatePrincipal,
        });

        const app = new Hono().post(
            '/',
            async (ctx) => ctx.json(await authenticationSession.completeQrCodeLogin(ctx, {
                completionToken: 'completion-token',
                ip: '127.0.0.2',
            })),
        );

        const response = await app.request('/', { method: 'POST' });

        await expect(response.json()).resolves.toEqual({ state: 'pending' });
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(response.headers.get('set-cookie')).toBeNull();
    });
});
