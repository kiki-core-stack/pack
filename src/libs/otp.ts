import { random } from 'lodash-es';
import {
    exportKey,
    generateKey,
    getKeyUri,
    totp as getTotpCode,
    importKey,
} from 'otp-io';
import {
    hmac,
    randomBytes,
} from 'otp-io/crypto';

import { redisController } from '@/controllers/redis';
import type { EmailOtpCodeType } from '@/types/otp';

export const verifyTotpCode = async (code: string, secret: string) => code === await getTotpCode(hmac, { secret: importKey(secret) });

export function generateTotpSecretData(issuer: string, name: string) {
    const secretKey = generateKey(randomBytes, random(16, 20));
    const url = getKeyUri({
        issuer,
        name,
        secret: secretKey,
        type: 'totp',
    });

    return {
        secret: exportKey(secretKey),
        url,
    };
}

export async function verifyEmailOtpCode(code: string, type: EmailOtpCodeType, email: string, redisAdditionalKey?: string) {
    const isVerified = code === await redisController.emailOtpCode.get(type, email, redisAdditionalKey);
    if (isVerified) await redisController.emailOtpCode.del(type, email, redisAdditionalKey);
    return isVerified;
}
