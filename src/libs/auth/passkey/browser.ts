import type { AuthSecurityOverviewData } from '../../../types/data/auth';

/**
 * 告知瀏覽器的密碼管理工具此帳號仍有效的 passkey，讓它移除已在本機或其他裝置上刪除的。
 * 只對本人的總覽有作用；瀏覽器不支援 WebAuthn Signal API 時略過。
 */
export async function signalAcceptedPasskeys(overview: AuthSecurityOverviewData) {
    const userHandle = overview.webauthn?.userHandle;
    if (!userHandle || !globalThis.PublicKeyCredential?.signalAllAcceptedCredentials) return;
    try {
        await PublicKeyCredential.signalAllAcceptedCredentials({
            allAcceptedCredentialIds: overview.passkeys.map((passkey) => passkey.id),
            rpId: overview.webauthn!.rpId,
            userId: userHandle,
        });
    } catch {
        // 密碼管理工具可能沒有這個帳號的 passkey，無需處理。
    }
}

/**
 * 後端回 `passkeyUnknown` 時，請瀏覽器的密碼管理工具移除那一把 passkey。`rpId` 取自驗證選項。
 */
export async function signalUnknownPasskey(rpId: string | undefined, credentialId: string) {
    if (!rpId || !globalThis.PublicKeyCredential?.signalUnknownCredential) return;
    try {
        await PublicKeyCredential.signalUnknownCredential({
            credentialId,
            rpId,
        });
    } catch {
        // 通知失敗不影響登入流程，無需處理。
    }
}
