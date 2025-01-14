import { randomAlphabeticString } from '@kikiutils/node/string';
import {
    addSeconds,
    format,
} from 'date-fns';

import {
    emailOTPExpirationSeconds,
    sendEmailOTPCodeCoolingSeconds,
} from '@/constants/otp';
import { redisController } from '@/controllers/redis';
import type { EmailOTPCodeType } from '@/types/otp';
import { sendEmail } from '@/utils/email';

export async function sendEmailOTPCode(type: EmailOTPCodeType, email: string, redisAdditionalKey?: string) {
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
}
