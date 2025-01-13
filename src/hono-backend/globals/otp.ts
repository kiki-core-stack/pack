import { setReadonlyConstantToGlobalThis } from '@kikiutils/node';
import { randomAlphabeticString } from '@kikiutils/node/string';
import {
    addSeconds,
    format,
} from 'date-fns';
import type { Context } from 'hono';
import {
    totp as getTOTPCode,
    importKey,
} from 'otp-io';
import { hmac } from 'otp-io/crypto';

import {
    emailOTPExpirationSeconds,
    sendEmailOTPCodeCoolingSeconds,
} from '@/constants/otp';
import { redisController } from '@/controllers/redis';
import type { EmailOTPCodeType } from '@/types/otp';
import { sendEmail } from '@/utils/email';

declare global {
    const sendEmailOTPCode: (type: EmailOTPCodeType, email: string, redisAdditionalKey?: string) => Promise<boolean>;
    const verifyEmailOTPCode: (codeOrCtx: Context | string, type: EmailOTPCodeType, email: string, redisAdditionalKey?: string) => Promise<boolean>;
    const verifyTOTPCode: (codeOrCtx: Context | string, secret: string) => Promise<boolean>;
}

setReadonlyConstantToGlobalThis<typeof sendEmailOTPCode>('sendEmailOTPCode', async (type, email, redisAdditionalKey) => {
    const emailOTPCodeTTL = await redisController.emailOTPCode.ttl(type, email, redisAdditionalKey);
    if (emailOTPCodeTTL > 0 && emailOTPExpirationSeconds - emailOTPCodeTTL < sendEmailOTPCodeCoolingSeconds) throwAPIError(429, 'Email OTP驗證碼已發送過，請稍後再試！');
    const emailOTPCode = randomAlphabeticString(6);
    const htmlContentTexts = [
        `您的Email OTP驗證碼為：<strong>${emailOTPCode}</strong>`,
        `此驗證碼在 ${format(addSeconds(new Date(), emailOTPExpirationSeconds), `yyyy-MM-dd HH:mm:ss '(UTC'XXX')'`)} 前有效。`,
        '請注意，一旦此驗證碼通過驗證，即使後續操作失敗（如登入失敗），驗證碼也會立即失效。',
    ];

    const sendResult = await sendEmail(email, 'Email OTP驗證碼', htmlContentTexts.join('<br />'));
    if (sendResult.success) await redisController.emailOTPCode.setex(emailOTPExpirationSeconds, emailOTPCode, type, email, redisAdditionalKey);
    else console.error('發送Email OTP驗證碼失敗：', sendResult.error);
    return sendResult.success;
});

setReadonlyConstantToGlobalThis<typeof verifyEmailOTPCode>('verifyEmailOTPCode', async (codeOrCtx, type, email, redisAdditionalKey) => {
    const emailOTPCode = typeof codeOrCtx === 'string' ? codeOrCtx : (await codeOrCtx.req.json<{ emailOTPCode?: string }>()).emailOTPCode;
    if (!emailOTPCode) return false;
    const isVerified = emailOTPCode === await redisController.emailOTPCode.get(type, email, redisAdditionalKey);
    if (isVerified) await redisController.emailOTPCode.del(type, email, redisAdditionalKey);
    return isVerified;
});

setReadonlyConstantToGlobalThis<typeof verifyTOTPCode>('verifyTOTPCode', async (codeOrCtx, secret) => {
    const totpCode = typeof codeOrCtx === 'string' ? codeOrCtx : (await codeOrCtx.req.json<{ totpCode?: string }>()).totpCode;
    if (!totpCode) return false;
    return totpCode === await getTOTPCode(hmac, { secret: importKey(secret) });
});
