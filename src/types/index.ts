export type {} from '@kikiutils/mongoose/types';
export type {} from '@kikiutils/types';

declare global {
	type TwoFactorAuthenticationMethod = 'emailOtp' | 'totp';
	type TwoFactorAuthenticationStatus = Record<TwoFactorAuthenticationMethod, boolean>;
}
