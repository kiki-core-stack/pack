import type { Promisable } from 'type-fest';
import type * as z from 'zod';

import type { PlatformScope } from '../../constants/platform';
import type {
    PlatformAuthConfig,
    PlatformConfigByScope,
} from '../../types/platform';
import { getPlatformConfig } from '../platform/config';

import { getAuthSecretEncryptionKeys } from './secret-encryption';
import type {
    AuthMessage,
    AuthPrincipal,
    AuthRealmEvent,
} from './types';

export type AuthPlatformScope = {
    [S in PlatformScope]: PlatformConfigByScope[S] extends { auth: PlatformAuthConfig } ? S : never;
}[PlatformScope];

/**
 * realm 的帳號 model 需要的操作；mongoose model 皆符合。
 */
export interface AuthPrincipalModel<P extends AuthPrincipal> {
    exists: (filter: { _id: string }) => PromiseLike<unknown>;
    findById: (id: string) => PromiseLike<null | P>;
    updateOne: (
        filter: { _id: P['_id']; password: null | string },
        update: { $set: { password: string } },
    ) => PromiseLike<{ matchedCount: number }>;
}

export interface AuthRealm<P extends AuthPrincipal = AuthPrincipal> extends Readonly<Omit<
    AuthRealmOptions<P>,
    'cookieSameSite' | 'webauthn'
>> {
    readonly cookieSameSite: 'lax' | 'strict';

    findPrincipalById: (principalId: string) => Promise<null | P>;

    /**
     * 目前的 auth 政策（平台設定，本機快取）。
     */
    getConfig: () => Promise<PlatformAuthConfig>;
    readonly webauthn?: Readonly<{ rpId: string }>;
}

/**
 * 把驗證碼與重設密碼的 token 寄給帳號的通道；管道（email、簡訊、通訊軟體…）與訊息內容由 realm 決定。
 */
export interface AuthRealmMessengerOptions<P extends AuthPrincipal = AuthPrincipal> {
    /**
     * 顯示給使用者的遮罩後收件位址，例如 `a***@example.com`。
     */
    getDestinationHint?: (principal: P) => string | undefined;

    /**
     * 寄出訊息，回傳是否寄出；帳號沒有可用的收件位址時回傳 false。
     */
    send: (principal: P, message: AuthMessage) => Promisable<boolean>;
}

export interface AuthRealmOptions<P extends AuthPrincipal = AuthPrincipal> {
    /**
     * 必須使用 `__Host-` 前綴。
     */
    cookieName: string;

    /**
     * 前端以 SSR 判斷登入狀態的 realm 設為 `lax`；此時 GET 路由不得有寫入行為。
     *
     * @defaultValue 'strict'
     */
    cookieSameSite?: 'lax' | 'strict';

    /**
     * 顯示給使用者的名稱：驗證器 App 中的發行者，以及 passkey 提示中的網站名稱。
     */
    displayName: string;

    /**
     * 以登入用的帳號字串（已去除前後空白）找出帳號；不需檢查是否啟用。
     */
    findPrincipalByIdentifier: (identifier: string) => Promise<null | P>;

    /**
     * 顯示在驗證器 App 與 passkey 提示中的帳號名稱。
     */
    getPrincipalDisplayName: (principal: P) => string;

    /**
     * 帳號是否已設定密碼；以外部身分註冊的帳號可能沒有。
     *
     * @defaultValue 帳號文件的 `password` 為非空字串；有自訂 `verifyPassword` 時一律視為有。
     */
    hasPassword?: (principal: P) => boolean;
    isPrincipalActive: (principal: P) => boolean;

    /**
     * 有填才支援：未登入的重設密碼，以及沒有第二因子的帳號以驗證碼通過高危操作驗證。
     */
    messenger?: AuthRealmMessengerOptions<P>;
    model: AuthPrincipalModel<P>;

    /**
     * Redis key 的命名空間，各 realm 不可重複。
     */
    name: string;

    /**
     * @defaultValue `strongPasswordSchema`
     */
    newPasswordSchema?: z.ZodType<string>;

    /**
     * 每筆驗證事件寫入後呼叫，例如寄送通知；失敗只記錄錯誤。
     */
    onEvent?: (event: AuthRealmEvent) => Promisable<void>;

    /**
     * 工作階段被踢除後呼叫，例如通知 ws.io-server 斷線；失敗只記錄錯誤。
     */
    onSessionsRevoked?: (principalId: string, sessionIds: string[]) => Promisable<void>;

    /**
     * 前端的來源（例如 `https://admin.example.com`），用於寫入類請求的 Origin 檢查與 WebAuthn 驗證；
     * 其網域即 passkey 的 `rpId`，有帳號綁定 passkey 後不可更改。
     */
    origin: string;

    /**
     * 本人變更密碼的方式。`currentPassword`：輸入目前密碼，有第二因子時另需高危操作驗證。
     * `verification`：只需高危操作驗證。帳號還沒有密碼時一律為後者。
     *
     * @defaultValue 'currentPassword'
     */
    passwordChange?: 'currentPassword' | 'verification';
    scope: AuthPlatformScope;

    /**
     * 寫入新密碼，回傳是否寫入。只能在儲存的密碼仍是 `principal` 載入時的那一個時寫入，否則回傳 false，
     * 不可覆寫期間被其他請求變更的密碼。
     *
     * @defaultValue 以 `updateOne({ _id, password: <載入時的雜湊，沒有密碼時為 null> }, { $set: { password } })`
     * 寫入，由 model 的雜湊欄位處理雜湊。
     */
    setPassword?: (principal: P, password: string) => Promise<boolean>;

    /**
     * @defaultValue 呼叫帳號文件的 `verifyPassword`。
     */
    verifyPassword?: (principal: P, password: string) => Promise<boolean>;

    /**
     * 是否支援 passkey。
     */
    webauthn?: true;
}

// Constants/Variables
const authRealms = new Map<string, AuthRealm<any>>();

// Functions

/**
 * 定義一種可登入的身分；設定內容見 `docs/kcs/auth.md`。
 */
export function defineAuthRealm<P extends AuthPrincipal>(options: AuthRealmOptions<P>): AuthRealm<P> {
    if (!/^[a-z][\da-z-]*$/.test(options.name)) throw new Error(`Invalid auth realm name: ${options.name}`);
    if (authRealms.has(options.name)) throw new Error(`Duplicate auth realm: ${options.name}`);
    if (!options.cookieName.startsWith('__Host-')) {
        throw new Error(`Auth realm ${options.name} cookie name must start with __Host-`);
    }

    // 加密金鑰設定有誤時在啟動時就失敗，而不是等到第一次綁定驗證器。
    getAuthSecretEncryptionKeys();
    if (!URL.canParse(options.origin) || new URL(options.origin).origin !== options.origin) {
        throw new Error(`Invalid origin of auth realm ${options.name}: ${options.origin}`);
    }

    const realm: AuthRealm<P> = {
        ...options,
        cookieSameSite: options.cookieSameSite ?? 'strict',
        findPrincipalById: async (principalId) => await options.model.findById(principalId),
        getConfig: async () => (await getPlatformConfig(options.scope)).auth,
        webauthn: options.webauthn && { rpId: new URL(options.origin).hostname },
    };

    authRealms.set(realm.name, realm);
    return realm;
}

export function getAuthRealm(name: string) {
    return authRealms.get(name);
}
