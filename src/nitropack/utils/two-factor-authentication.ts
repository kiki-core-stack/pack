import { formatDateOrTimestamp } from '@kikiutils/node/datetime';
import { addSeconds } from 'date-fns';
import { isError, readBody } from 'h3';
import type { H3Event } from 'h3';
import { nanoid } from 'nanoid';
import { importKey, totp as getTotpCode } from 'otp-io';
import { hmac } from 'otp-io/crypto';

import { emailOtpExpirationSeconds, sendEmailOtpCodeCoolingSeconds } from '../../constants';
import redisController from '../../controllers/redis';
import type { AdminDocument } from '../../models';
import { sendEmail } from '../../utils/email';
import { createApiErrorAndThrow } from './api-response';

export const requireTwoFactorAuthentication = async (event: H3Event, emailOtp: boolean = true, totp: boolean = true, admin?: AdminDocument, autoSendEmailOtpCode?: boolean) => {
	if (!(admin = admin || event.context.admin)) createApiErrorAndThrow();
	const { emailOtpCode, totpCode } = await readBody<TwoFactorAuthenticationCodesData>(event);
	const requiredTwoFactorAuthentications = {
		emailOtp: !!(emailOtp && admin.twoFactorAuthenticationStatus.emailOtp && admin.email),
		totp: !!(totp && admin.twoFactorAuthenticationStatus.totp && admin.totpSecret)
	};

	if (requiredTwoFactorAuthentications.emailOtp) {
		if (!emailOtpCode) {
			if (autoSendEmailOtpCode) {
				try {
					await sendEmailOtpCode(admin);
				} catch (error) {
					if (!isError(error) || error.statusCode !== 429) createApiErrorAndThrow(500, '發送Email OTP驗證碼失敗！', { requiredTwoFactorAuthentications });
				}
			}

			createApiErrorAndThrow(400, '請輸入Email OTP驗證碼！', { requiredTwoFactorAuthentications });
		}

		if (emailOtpCode !== (await redisController.twoFactorAuthentication.emailOtpCode.get(admin))) createApiErrorAndThrow(400, 'Email OTP驗證碼錯誤！', { requiredTwoFactorAuthentications });
		await redisController.twoFactorAuthentication.emailOtpCode.del(admin);
	}

	if (requiredTwoFactorAuthentications.totp) {
		if (!totpCode) createApiErrorAndThrow(400, '請輸入TOTP驗證碼！', { requiredTwoFactorAuthentications });
		if (totpCode !== (await getTotpCode(hmac, { secret: importKey(admin.totpSecret!) }))) createApiErrorAndThrow(400, 'TOTP驗證碼錯誤！', { requiredTwoFactorAuthentications });
	}
};

export const sendEmailOtpCode = async (admin: AdminDocument) => {
	if (!admin.email) createApiErrorAndThrow(400, 'Email未綁定，無法發送OTP驗證碼！');
	const emailOtpTTL = await redisController.twoFactorAuthentication.emailOtpCode.ttl(admin);
	if (emailOtpTTL > 0 && emailOtpExpirationSeconds - emailOtpTTL < sendEmailOtpCodeCoolingSeconds) createApiErrorAndThrow(429, 'Email OTP驗證碼已發送過，請稍後再試！');
	const emailOtpCode = nanoid(6);
	await redisController.twoFactorAuthentication.emailOtpCode.set(admin, emailOtpCode, emailOtpExpirationSeconds);
	const htmlContentTexts = [
		`您的Email OTP驗證碼為：<strong>${emailOtpCode}</strong>`,
		`此驗證碼在 ${formatDateOrTimestamp(addSeconds(new Date(), emailOtpExpirationSeconds), `yyyy-MM-dd HH:mm:ss '(UTC'XXX')'`)} 前有效。`,
		'請注意，一旦此驗證碼通過驗證，即使後續操作失敗（如登入失敗），驗證碼也會立即失效。'
	];

	return (await sendEmail(admin.email, 'Email OTP驗證碼', htmlContentTexts.join('<br />'), undefined, admin.account)).success;
};
