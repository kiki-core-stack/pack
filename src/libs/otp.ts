import { random } from 'lodash-es';
import {
    exportKey,
    generateKey,
    getKeyUri,
    totp as getTOTPCode,
    importKey,
} from 'otp-io';
import {
    hmac,
    randomBytes,
} from 'otp-io/crypto';

import { redisController } from '@/controllers/redis';
import type { EmailOTPCodeType } from '@/types/otp';

export const verifyTOTPCode = async (code: string, secret: string) => code === await getTOTPCode(hmac, { secret: importKey(secret) });

export function generateTOTPSecretData(issuer: string, name: string) {
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

export async function verifyEmailOTPCode(code: string, type: EmailOTPCodeType, email: string, redisAdditionalKey?: string) {
    const isVerified = code === await redisController.emailOTPCode.get(type, email, redisAdditionalKey);
    if (isVerified) await redisController.emailOTPCode.del(type, email, redisAdditionalKey);
    return isVerified;
}
