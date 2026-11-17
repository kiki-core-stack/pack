import { Buffer } from 'node:buffer';
import {
    createCipheriv,
    createDecipheriv,
    hkdfSync,
    randomBytes,
} from 'node:crypto';

interface SecretEncryptionKey {
    id: string;
    key: Buffer;
}

// Constants/Variables
const ciphertextVersion = 'v1';
const minKeyByteLength = 32;
let secretEncryptionKeys: SecretEncryptionKey[] | undefined;

// Functions

/**
 * 解密 `encryptAuthSecret` 的輸出；找不到對應金鑰或內容被竄改時回傳 undefined。
 * `outdated` 為 true 表示密文不是用第一把金鑰加密，呼叫端應在驗證成功後重新加密。
 */
export function decryptAuthSecret(ciphertext: string, context: string) {
    const [
        version,
        keyId,
        iv,
        authTag,
        data,
        ...rest
    ] = ciphertext.split('.');

    if (version !== ciphertextVersion || !keyId || !iv || !authTag || !data || rest.length) return;
    const keys = getAuthSecretEncryptionKeys();
    const key = keys.find((key) => key.id === keyId);
    if (!key) return;

    try {
        const decipher = createDecipheriv('aes-256-gcm', key.key, Buffer.from(iv, 'base64url'));
        decipher.setAAD(Buffer.from(context));
        decipher.setAuthTag(Buffer.from(authTag, 'base64url'));
        return {
            outdated: key !== keys[0],
            value: Buffer.concat([
                decipher.update(Buffer.from(data, 'base64url')),
                decipher.final(),
            ]).toString(),
        };
    } catch {}
}

/**
 * 以 AES-256-GCM 加密要存進資料庫的秘密（例如 TOTP 密鑰）。
 * `context` 綁定密文的用途與擁有者（例如 `totp:<realm>:<principalId>`），解密時必須相同。
 *
 * 密文格式：`v1.<金鑰識別碼>.<iv>.<authTag>.<data>`；金鑰識別碼由金鑰本身衍生，解密時直接選對應的金鑰。
 */
export function encryptAuthSecret(value: string, context: string) {
    const key = getAuthSecretEncryptionKeys()[0]!;
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key.key, iv);
    cipher.setAAD(Buffer.from(context));
    const data = Buffer.concat([
        cipher.update(value),
        cipher.final(),
    ]);

    return [
        ciphertextVersion,
        key.id,
        iv.toString('base64url'),
        cipher.getAuthTag().toString('base64url'),
        data.toString('base64url'),
    ].join('.');
}

/**
 * 環境變數 `AUTH_SECRET_ENCRYPTION_KEYS`，格式與 `COOKIE_SESSION_KEYS` 相同：以逗號分隔、每項去除前後空白，
 * 每項為至少 32 bytes 的任意字串，以 HKDF-SHA256 衍生為 AES-256 金鑰。第一把用於加密，其餘只用於解密。
 * 定義 realm 時就會讀取，設定有誤在啟動時即失敗。
 */
export function getAuthSecretEncryptionKeys() {
    if (secretEncryptionKeys) return secretEncryptionKeys;
    const keys = (process.env.AUTH_SECRET_ENCRYPTION_KEYS ?? '')
        .split(',')
        .map((key) => key.trim())
        .filter(Boolean)
        .map((key) => {
            const secret = Buffer.from(key);
            if (secret.length < minKeyByteLength) {
                throw new Error(`AUTH_SECRET_ENCRYPTION_KEYS entries must be at least ${minKeyByteLength} bytes`);
            }

            const derive = (info: string, length: number) => Buffer.from(
                hkdfSync('sha256', secret, Buffer.alloc(0), info, length),
            );

            return {
                id: derive('kcs:auth:secret-encryption:key-id', 6).toString('base64url'),
                key: derive('kcs:auth:secret-encryption', 32),
            };
        });

    if (!keys.length) throw new Error('AUTH_SECRET_ENCRYPTION_KEYS requires at least one key');
    secretEncryptionKeys = keys;
    return keys;
}
