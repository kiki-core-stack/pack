import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import type { Types } from 'mongoose';
import { Schema } from 'mongoose';

export type AuthPrincipalSettingDocument = MongooseHydratedDocument<AuthPrincipalSetting>;
type AuthPrincipalSettingModel = BaseMongoosePaginateModel<AuthPrincipalSetting>;

export interface AuthPrincipalSetting {
    _id: Types.ObjectId;
    createdAt: Date;
    passkeys: AuthPrincipalSettingPasskey[];
    principalId: Types.ObjectId;
    realm: string;
    recoveryCodes: AuthPrincipalSettingRecoveryCode[];

    /**
     * 每次變更「有哪些因子、是否開啟或被強制」就加一，作為 `mutateAuthPrincipalSetting` 的更新條件。
     */
    revision: number;
    totp?: AuthPrincipalSettingTotp;

    /**
     * 本人是否開啟雙重驗證；只有在已綁定至少一個第二因子時才能為 true。
     */
    twoFactorEnabled: boolean;

    /**
     * 此帳號是否被有管理權限者強制使用雙重驗證。
     */
    twoFactorEnforced: boolean;
    updatedAt: Date;

    /**
     * 每個帳號一組的隨機值（base64url），不直接使用 principalId。
     */
    webauthnUserHandle: string;
}

export interface AuthPrincipalSettingPasskey {
    aaguid: string;

    /**
     * 新舊值皆為 0 時不檢查（同步型 passkey 的計數器恆為 0）。
     */
    counter: number;
    createdAt: Date;

    /**
     * 憑證 ID（base64url）。
     */
    credentialId: string;
    deviceType: 'multiDevice' | 'singleDevice';
    lastUsedAt?: Date;
    name: string;

    /**
     * 公鑰（base64url）。
     */
    publicKey: string;
    transports: string[];
}

export interface AuthPrincipalSettingRecoveryCode {
    /**
     * 救援碼的 SHA-256。
     */
    hash: string;
    usedAt?: Date;
}

export interface AuthPrincipalSettingTotp {
    confirmedAt: Date;

    /**
     * 上次通過驗證的時間步；同一步或更早的驗證碼一律拒絕。
     */
    lastUsedStep: number;

    /**
     * 加密後的密鑰（見 `libs/auth/secret-encryption`）。
     */
    secret: string;
}

const schema = new Schema<AuthPrincipalSetting, AuthPrincipalSettingModel>({
    passkeys: {
        default: () => [],
        required: true,
        type: [
            {
                _id: false,
                aaguid: s.string().required,
                counter: s.number().min(0).required,
                createdAt: s.date().required,
                credentialId: s.string().required,
                deviceType: s.string().enum([
                    'multiDevice',
                    'singleDevice',
                ]).required,
                lastUsedAt: s.date().nonRequired,
                name: s.string().maxlength(64).trim.required,
                publicKey: s.string().required,
                transports: {
                    default: () => [],
                    required: true,
                    type: [s.string().required],
                },
            },
        ],
    },
    principalId: s.objectId().immutable.required,
    realm: s.string().immutable.required,
    recoveryCodes: {
        default: () => [],
        required: true,
        type: [
            {
                _id: false,
                hash: s.string().required,
                usedAt: s.date().nonRequired,
            },
        ],
    },
    revision: s.number().default(0).required,
    totp: {
        required: false,
        type: {
            _id: false,
            confirmedAt: s.date().required,
            lastUsedStep: s.number().required,
            secret: s.string().required,
        },
    },
    twoFactorEnabled: s.boolean().default(false).required,
    twoFactorEnforced: s.boolean().default(false).required,
    webauthnUserHandle: s.string().immutable.unique.required,
});

schema.index(
    {
        /* eslint-disable perfectionist/sort-objects */
        realm: 1,
        principalId: 1,
        /* eslint-enable perfectionist/sort-objects */
    },
    { unique: true },
);

// 只涵蓋有 passkey 的文件；否則沒有 passkey 的文件會以 null 互相衝突。
schema.index(
    { 'passkeys.credentialId': 1 },
    {
        partialFilterExpression: { 'passkeys.credentialId': { $exists: true } },
        unique: true,
    },
);

export const AuthPrincipalSettingModel = buildMongooseModel<AuthPrincipalSetting, AuthPrincipalSettingModel>(
    'auth.principal_settings',
    'AuthPrincipalSetting',
    schema,
);
