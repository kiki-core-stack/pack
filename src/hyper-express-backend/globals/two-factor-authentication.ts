import type { Request } from '@kikiutils/hyper-express';
import { formatDateOrTimestamp } from '@kikiutils/node/datetime';
import { randomAlphabeticString } from '@kikiutils/node/string';
import { addSeconds } from 'date-fns';
import { importKey, totp as getTotpCode } from 'otp-io';
import { hmac } from 'otp-io/crypto';

import redisController from '../../controllers/redis';
import { emailOtpExpirationSeconds, sendEmailOtpCodeCoolingSeconds } from '../../constants/two-factor-authentication';
import type { AdminDocument } from '../../models';
import { sendEmail } from '../../utils/email';

declare global {
	function requireTwoFactorAuthentication(request: Request, emailOtp?: boolean, totp?: boolean, admin?: AdminDocument, autoSendEmailOtpCode?: boolean): Promise<void>;
	function sendEmailOtpCode(admin: AdminDocument): Promise<boolean>;
}

globalThis.requireTwoFactorAuthentication = async (request, emailOtp = true, totp = true, admin, autoSendEmailOtpCode) => {
	// @ts-expect-error
	if (!(admin = admin || request.locals.admin)) throwApiError();
	const { emailOtpCode, totpCode } = await request.json<TwoFactorAuthenticationCodesData>();
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
					if (!(error instanceof ApiError) || error.statusCode !== 429) throwApiError(500, '發送Email OTP驗證碼失敗！', { requiredTwoFactorAuthentications });
				}
			}

			throwApiError(400, '請輸入Email OTP驗證碼！', { requiredTwoFactorAuthentications });
		}

		if (emailOtpCode !== (await redisController.twoFactorAuthentication.emailOtpCode.get(admin))) throwApiError(400, 'Email OTP驗證碼錯誤！', { requiredTwoFactorAuthentications });
		await redisController.twoFactorAuthentication.emailOtpCode.del(admin);
	}

	if (requiredTwoFactorAuthentications.totp) {
		if (!totpCode) throwApiError(400, '請輸入TOTP驗證碼！', { requiredTwoFactorAuthentications });
		if (totpCode !== (await getTotpCode(hmac, { secret: importKey(admin.totpSecret!) }))) throwApiError(400, 'TOTP驗證碼錯誤！', { requiredTwoFactorAuthentications });
	}
};

globalThis.sendEmailOtpCode = async (admin: AdminDocument) => {
	if (!admin.email) throwApiError(400, 'Email未綁定，無法發送OTP驗證碼！');
	const emailOtpTTL = await redisController.twoFactorAuthentication.emailOtpCode.ttl(admin);
	if (emailOtpTTL > 0 && emailOtpExpirationSeconds - emailOtpTTL < sendEmailOtpCodeCoolingSeconds) throwApiError(429, 'Email OTP驗證碼已發送過，請稍後再試！');
	const emailOtpCode = randomAlphabeticString(6);
	const htmlContentTexts = [
		`您的Email OTP驗證碼為：<strong>${emailOtpCode}</strong>`,
		`此驗證碼在 ${formatDateOrTimestamp(addSeconds(new Date(), emailOtpExpirationSeconds), `yyyy-MM-dd HH:mm:ss '(UTC'XXX')'`)} 前有效。`,
		'請注意，一旦此驗證碼通過驗證，即使後續操作失敗（如登入失敗），驗證碼也會立即失效。'
	];

	const sendResult = (await sendEmail(admin.email, 'Email OTP驗證碼', htmlContentTexts.join('<br />'), undefined, admin.account)).success;
	if (sendResult) await redisController.twoFactorAuthentication.emailOtpCode.set(admin, emailOtpCode, emailOtpExpirationSeconds);
	return sendResult;
};
