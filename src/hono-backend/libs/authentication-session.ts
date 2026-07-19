import type { Context } from 'hono';
import {
    deleteCookie as deleteHonoCookie,
    getCookie,
    setCookie,
} from 'hono/cookie';
import type { Except } from 'type-fest';

import type {
    AuthenticateAuthenticationSessionInput,
    AuthenticationSessionPrincipalValidationData,
    AuthenticationSessionQrCodeLoginCompletionResult,
    AuthenticationSessionStore,
    CompleteAuthenticationSessionQrCodeLoginInput,
    CreateAuthenticationSessionInput,
    RotateAuthenticationSessionInput,
} from '../../types/authentication-session';
import type { AuthenticationSessionData } from '../../types/data/authentication-session';
import { baseSetCookieOptions } from '../constants/cookie';

// Types

/**
 * 可將權威主體資料快取在本次 request context，但呼叫端仍必須以回傳的工作階段作為授權閘門，
 * 因為 Redis 會在主體驗證完成後再次原子確認 Session 狀態。
 */
export type HonoAuthenticationSessionPrincipalValidator = (
    ctx: Context,
    data: AuthenticationSessionPrincipalValidationData,
) => Promise<boolean>;

type HonoAuthenticationSessionQrCodeLoginCompletionResult =
  // 尚未核准時不包含任何 Session 或 Cookie 資料。
  | Extract<AuthenticationSessionQrCodeLoginCompletionResult, { state: 'pending' }>
  // 完成後只向 route 暴露 Session，token 已由 adapter 寫入 Cookie。
  | {
      session: AuthenticationSessionData;
      state: 'completed';
  };

interface HonoAuthenticationSession {
    /** 從 request Cookie 取得 token 並驗證 Session。 */
    authenticate: (
        ctx: Context,
        input: Except<AuthenticateAuthenticationSessionInput, 'token' | 'validatePrincipal'>,
    ) => Promise<AuthenticationSessionData | undefined>;

    /** 以 completion token 完成 QR 登入並在成功時寫入 Cookie。 */
    completeQrCodeLogin: (
        ctx: Context,
        input: Except<CompleteAuthenticationSessionQrCodeLoginInput, 'validatePrincipal'>,
    ) => Promise<HonoAuthenticationSessionQrCodeLoginCompletionResult | undefined>;

    /** 一般登入成功後建立 Session 並寫入 Cookie。 */
    create: (ctx: Context, input: CreateAuthenticationSessionInput) => Promise<AuthenticationSessionData>;

    /** 登出或明確失效時刪除瀏覽器 Cookie。 */
    deleteCookie: (ctx: Context) => void;

    /** 驗證既有 token 後原子輪換並覆寫 Cookie。 */
    rotate: (ctx: Context, input: Except<RotateAuthenticationSessionInput, 'token' | 'validatePrincipal'>) => Promise<
        AuthenticationSessionData | undefined
    >;
}

/** 將 Authentication Session store 組合成 Hono Cookie adapter 所需依賴。 */
export interface HonoAuthenticationSessionOptions {
    /** 不含 __Host- prefix 的 Cookie 名稱，由 Hono prefix 選項統一套用。 */
    cookieName: string;

    /** HTTP adapter 實際需要的最小 Session store 能力集合。 */
    store: Pick<AuthenticationSessionStore, 'authenticate' | 'create' | 'qrCodeLogin' | 'rotate'>;

    /** 可存取 Hono context 的權威主體驗證器。 */
    validatePrincipal: HonoAuthenticationSessionPrincipalValidator;
}

// Functions

/** 建立只負責 HTTP Cookie 與 request context 邊界的 Authentication Session adapter。 */
export function createHonoAuthenticationSession(options: HonoAuthenticationSessionOptions): HonoAuthenticationSession {
    /** 使用與設定時相同的 __Host Cookie 屬性刪除登入 Cookie。 */
    function deleteCookie(ctx: Context) {
        // __Host- Cookie 必須使用根路徑、Secure 且不能設定 Domain。
        deleteHonoCookie(
            ctx,
            options.cookieName,
            {
                path: '/',
                prefix: 'host',
                secure: true,
            },
        );

        // 防止包含登入狀態變更的回應被任何中介層快取。
        ctx.header('Cache-Control', 'no-store');
    }

    /** 寫入新的 opaque token；瀏覽器保存時間依簽發結果設定，最終有效期限仍由伺服端判斷。 */
    function writeCookie(ctx: Context, token: string, maxAgeSeconds: number) {
        // 共用 Cookie 安全屬性，再補上本次 Session 的 Max-Age 與 __Host prefix。
        setCookie(
            ctx,
            options.cookieName,
            token,
            {
                ...baseSetCookieOptions,
                maxAge: maxAgeSeconds,
                prefix: 'host',
            },
        );

        // 簽發 token 的回應一律禁止快取。
        ctx.header('Cache-Control', 'no-store');
    }

    /** 驗證 request 中的 Session Cookie，不主動刪除可能已被並行請求輪換的舊 Cookie。 */
    async function authenticate(
        ctx: Context,
        input: Except<AuthenticateAuthenticationSessionInput, 'token' | 'validatePrincipal'>,
    ) {
        // 只讀取 __Host 版本 Cookie，避免同名但不同 scope 的 Cookie 混用。
        const token = getCookie(ctx, options.cookieName, 'host');
        if (!token) return;

        // 注入 request-aware 主體驗證器，再交由 store 完成 Redis 原子驗證。
        const authenticated = await options.store.authenticate({
            ...input,
            token,
            validatePrincipal: (data) => options.validatePrincipal(ctx, data),
        });

        // 無效 Session 直接回傳 undefined，由呼叫端拒絕授權。
        if (!authenticated) return;

        // 成功認證的回應可能包含個人狀態，因此禁止快取。
        ctx.header('Cache-Control', 'no-store');

        return authenticated;
    }

    /** 一般登入成功後簽發 Session，並將 token 留在 HttpOnly Cookie 中。 */
    async function create(ctx: Context, input: CreateAuthenticationSessionInput) {
        // store 建立 Redis 狀態並回傳一次性的明文 token。
        const created = await options.store.create(input);
        // HTTP 邊界負責寫 Cookie，不把 token 暴露給 route response。
        writeCookie(ctx, created.token, created.cookieMaxAgeSeconds);

        return created.session;
    }

    /** 輪詢 QR 登入結果；只有原子完成後才寫入正式 Session Cookie。 */
    async function completeQrCodeLogin(
        ctx: Context,
        input: Except<CompleteAuthenticationSessionQrCodeLoginInput, 'validatePrincipal'>,
    ): Promise<HonoAuthenticationSessionQrCodeLoginCompletionResult | undefined> {
        // pending 與 completed 狀態都不得由瀏覽器或代理快取。
        ctx.header('Cache-Control', 'no-store');

        // 主體權威驗證仍在建立目標 Session 前執行。
        const completed = await options.store.qrCodeLogin.complete({
            ...input,
            validatePrincipal: (data) => options.validatePrincipal(ctx, data),
        });

        // 無效或尚未核准時不建立 Cookie。
        if (!completed || completed.state === 'pending') return completed;

        // Lua 已原子建立全新 Session 後才把 token 寫入目標裝置。
        writeCookie(ctx, completed.token, completed.cookieMaxAgeSeconds);

        // token 已進入 HttpOnly Cookie，回傳值只保留業務需要的 Session data。
        return {
            session: completed.session,
            state: completed.state,
        };
    }

    /** 驗證並輪換既有 Session token，保留原 absolute expiry。 */
    async function rotate(
        ctx: Context,
        input: Except<RotateAuthenticationSessionInput, 'token' | 'validatePrincipal'>,
    ) {
        // 沒有 Cookie 時不進行 Redis 操作。
        const token = getCookie(ctx, options.cookieName, 'host');
        if (!token) return;

        // store 會驗證舊 token、主體資料與 Redis 狀態後原子替換 Session。
        const rotated = await options.store.rotate({
            ...input,
            token,
            validatePrincipal: (data) => options.validatePrincipal(ctx, data),
        });

        // 任何驗證或競態失敗都不覆寫現有 Cookie。
        if (!rotated) return;

        // 成功後用新 token 覆寫 Cookie，Max-Age 依 absolute TTL 剩餘時間向上取整。
        writeCookie(ctx, rotated.token, rotated.cookieMaxAgeSeconds);

        return rotated.session;
    }

    // 僅公開 HTTP route 真正需要的組合介面。
    return {
        authenticate,
        completeQrCodeLogin,
        create,
        deleteCookie,
        rotate,
    };
}
