import { setReadonlyConstantToGlobalThis } from '@kikiutils/node';
import { formatDateOrTimestamp } from '@kikiutils/node/datetime';
import { randomAlphabeticString } from '@kikiutils/node/string';
import { addSeconds } from 'date-fns';
import type { Context } from 'hono';
import { totp as getTOTPCode, importKey } from 'otp-io';
import { hmac } from 'otp-io/crypto';

import { emailOTPExpirationSeconds, sendEmailOTPCodeCoolingSeconds } from '@/constants/two-factor-authentication';
import { redisController } from '@/controllers/redis';
import type { AdminDocument } from '@/models/admin';
import { sendEmail } from '@/utils/email';

declare global {
	const requireTwoFactorAuthentication: (ctx: Context, emailOTP?: boolean, totp?: boolean, admin?: AdminDocument, autoSendEmailOTPCode?: boolean) => Promise<void>;
	const sendEmailOTPCode: (admin: AdminDocument) => Promise<boolean>;
}

async function verifyEmailOTPCode(admin: AdminDocument, requiredTwoFactorAuthentications: TwoFactorAuthenticationStatus, emailOTPCode?: string, autoSendEmailOTPCode?: boolean) {
	if (!emailOTPCode) {
		if (autoSendEmailOTPCode) {
			try {
				await sendEmailOTPCode(admin);
			} catch (error) {
				if (!(error instanceof APIError) || error.statusCode !== 429) throwAPIError(500, '發送Email OTP驗證碼失敗！', { requiredTwoFactorAuthentications });
			}
		}

		throwAPIError(400, '請輸入Email OTP驗證碼！', { requiredTwoFactorAuthentications });
	}

	if (emailOTPCode !== (await redisController.twoFactorAuthentication.emailOTPCode.get(admin))) throwAPIError(400, 'Email OTP驗證碼錯誤！', { requiredTwoFactorAuthentications });
	await redisController.twoFactorAuthentication.emailOTPCode.del(admin);
}

async function verifyTOTPCode(admin: AdminDocument, requiredTwoFactorAuthentications: TwoFactorAuthenticationStatus, totpCode?: string) {
	if (!totpCode) throwAPIError(400, '請輸入TOTP驗證碼！', { requiredTwoFactorAuthentications });
	if (totpCode !== (await getTOTPCode(hmac, { secret: importKey(admin.totpSecret!) }))) throwAPIError(400, 'TOTP驗證碼錯誤！', { requiredTwoFactorAuthentications });
}

setReadonlyConstantToGlobalThis<typeof requireTwoFactorAuthentication>('requireTwoFactorAuthentication', async (ctx, emailOTP, totp, admin, autoSendEmailOTPCode) => {
	// @ts-expect-error Ignore this error.
	admin = admin || ctx.admin;
	if (!admin) throwAPIError();
	const { emailOTPCode, totpCode } = await ctx.req.json<TwoFactorAuthenticationCodesData>();
	const requiredTwoFactorAuthentications = {
		emailOTP: !!(emailOTP && admin.twoFactorAuthenticationStatus.emailOTP && admin.email),
		totp: !!(totp && admin.twoFactorAuthenticationStatus.totp && admin.totpSecret),
	};

	if (requiredTwoFactorAuthentications.emailOTP) await verifyEmailOTPCode(admin, requiredTwoFactorAuthentications, emailOTPCode, autoSendEmailOTPCode);
	if (requiredTwoFactorAuthentications.totp) await verifyTOTPCode(admin, requiredTwoFactorAuthentications, totpCode);
});

setReadonlyConstantToGlobalThis<typeof sendEmailOTPCode>('sendEmailOTPCode', async (admin) => {
	if (!admin.email) throwAPIError(400, 'Email未綁定，無法發送OTP驗證碼！');
	const emailOTPTTL = await redisController.twoFactorAuthentication.emailOTPCode.ttl(admin);
	if (emailOTPTTL > 0 && emailOTPExpirationSeconds - emailOTPTTL < sendEmailOTPCodeCoolingSeconds) throwAPIError(429, 'Email OTP驗證碼已發送過，請稍後再試！');
	const emailOTPCode = randomAlphabeticString(6);
	const htmlContentTexts = [
		`您的Email OTP驗證碼為：<strong>${emailOTPCode}</strong>`,
		`此驗證碼在 ${formatDateOrTimestamp(addSeconds(new Date(), emailOTPExpirationSeconds), `yyyy-MM-dd HH:mm:ss '(UTC'XXX')'`)} 前有效。`,
		'請注意，一旦此驗證碼通過驗證，即使後續操作失敗（如登入失敗），驗證碼也會立即失效。',
	];

	const sendResult = (await sendEmail(admin.email, 'Email OTP驗證碼', htmlContentTexts.join('<br />'), undefined, admin.account)).success;
	if (sendResult) await redisController.twoFactorAuthentication.emailOTPCode.set(admin, emailOTPCode, emailOTPExpirationSeconds);
	return sendResult;
});
