import type { AuthenticationSessionPrincipalType } from '../../../../types/authentication-session';

/** 每個由此 template 衍生的產品必須使用自己的固定前綴，避免共用 Redis 時互相碰撞。 */
const applicationKeyPrefix = 'kiki-core-stack';

/** 建立同一 principal type 下所有 Authentication Session Redis key。 */
export function createRedisAuthenticationSessionKeys(
    principalType: AuthenticationSessionPrincipalType,
    environment?: string,
) {
    // 測試可明確傳入 environment；正式使用時才讀取部署環境變數。
    if (environment === undefined) {
        const { ENVIRONMENT } = process.env;
        environment = ENVIRONMENT;
    }

    // 空白環境名稱視為未設定，避免產生只有空白差異的 namespace。
    const normalizedEnvironment = environment?.trim();

    // ENVIRONMENT 僅隔離同一產品的不同部署環境，不用來識別不同產品。
    const keyPrefix = normalizedEnvironment
        ? `${applicationKeyPrefix}:${normalizedEnvironment}:`
        : `${applicationKeyPrefix}:`;

    return {
        // epoch 是主體目前有效的撤銷世代。
        epoch: (principalId: string) => `${keyPrefix}authenticationSessionEpoch:${principalType}:${principalId}`,
        // index 以到期時間排序該主體在特定世代下的全部 Session selector。
        index: (principalId: string, epoch: string) =>
            `${keyPrefix}authenticationSessions:${principalType}:${principalId}:${epoch}`,
        // QR Code Login request 以其隨機 selector 定位。
        qrCodeLogin: (selector: string) => `${keyPrefix}authenticationSessionQrCodeLogin:${principalType}:${selector}`,
        // Session hash 以 token selector 定位，不在 key 中暴露 validator。
        session: (selector: string) => `${keyPrefix}authenticationSession:${principalType}:${selector}`,
    };
}
