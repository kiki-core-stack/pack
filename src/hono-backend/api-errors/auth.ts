import { packLocaleCatalogs } from '../../i18n/catalogs';
import { authVerificationRequiredErrorDataSchema } from '../../schemas/api';
import { defineApiErrors } from '../libs/api/error';

export const {
    challengeExpired,
    incorrectPassword,
    invalidCredentials,
    invalidVerificationCode,
    originNotAllowed,
    passkeyLimitReached,
    passkeyUnknown,
    passkeyUnsupported,
    passkeyVerificationFailed,
    qrCodeLoginDisabled,
    qrCodeLoginExpired,
    secondFactorNotConfigured,
    secondFactorSetupRequired,
    sessionInvalid,
    tooManyAttempts,
    totpAlreadyConfigured,
    twoFactorEnforced,
    verificationCodeUnavailable,
    verificationRequired,
} = defineApiErrors(
    {
        challengeExpired: { status: 410 },
        incorrectPassword: { status: 400 },

        /**
         * Account not found, wrong password or disabled account alike, so responses never reveal whether an account
         * exists.
         */
        invalidCredentials: { status: 401 },
        invalidVerificationCode: { status: 400 },
        originNotAllowed: { status: 403 },
        passkeyLimitReached: { status: 409 },
        passkeyUnknown: { status: 400 },
        passkeyUnsupported: { status: 400 },
        passkeyVerificationFailed: { status: 400 },
        qrCodeLoginDisabled: { status: 403 },
        qrCodeLoginExpired: { status: 410 },
        secondFactorNotConfigured: { status: 409 },

        /**
         * The session is restricted: two-factor authentication is required but no second factor is set up yet.
         */
        secondFactorSetupRequired: { status: 403 },
        sessionInvalid: { status: 401 },
        tooManyAttempts: { status: 429 },
        totpAlreadyConfigured: { status: 409 },
        twoFactorEnforced: { status: 409 },

        /**
         * The realm has no messenger, or the account cannot use a verification code: it has a second factor or no
         * destination.
         */
        verificationCodeUnavailable: { status: 400 },

        /**
         * The operation needs a one-time verification grant in the `X-Auth-Verification` header; `errorData` tells the
         * operation to verify for and the factors the account can verify with.
         */
        verificationRequired: {
            errorData: authVerificationRequiredErrorDataSchema,
            status: 403,
        },
    },
    packLocaleCatalogs,
    (messages) => messages.apiErrors.auth,
);
