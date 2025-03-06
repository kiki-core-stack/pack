import logger from '@kikiutils/node/consola';
import { randomAlphabeticString } from '@kikiutils/node/string';
import {
    addSeconds,
    format,
} from 'date-fns';

import {
    emailOtpExpirationSeconds,
    sendEmailOtpCodeCoolingSeconds,
} from '@/constants/otp';
import { redisController } from '@/controllers/redis';
import type { EmailOtpCodeType } from '@/types/otp';
import { sendEmail } from '@/utils/email';

export async function sendEmailOtpCode(type: EmailOtpCodeType, email: string, redisAdditionalKey?: string) {
    const emailOtpCodeTtl = await redisController.emailOtpCode.ttl(type, email, redisAdditionalKey);
    if (emailOtpCodeTtl > 0 && emailOtpExpirationSeconds - emailOtpCodeTtl < sendEmailOtpCodeCoolingSeconds) throwApiError(429, 'Email OTP驗證碼已發送過，請稍後再試！');
    const emailOtpCode = randomAlphabeticString(6);
    const htmlContentTexts = [
        `您的Email OTP驗證碼為：<strong>${emailOtpCode}</strong>`,
        `此驗證碼在 ${format(addSeconds(new Date(), emailOtpExpirationSeconds), `yyyy-MM-dd HH:mm:ss '(UTC'XXX')'`)} 前有效。`,
        '請注意，一旦此驗證碼通過驗證，即使後續操作失敗（如登入失敗），驗證碼也會立即失效。',
    ];

    const sendResult = await sendEmail(email, 'Email OTP驗證碼', htmlContentTexts.join('<br />'));
    if (sendResult.success) await redisController.emailOtpCode.setex(emailOtpExpirationSeconds, emailOtpCode, type, email, redisAdditionalKey);
    else logger.error('發送Email OTP驗證碼失敗：', sendResult.error);
    return sendResult.success;
}
