import type { AuthenticationSessionPrincipalType } from '../../../../types/authentication-session';

const applicationKeyPrefix = 'kiki-core-stack';

export function createRedisAuthenticationSessionKeys(
    principalType: AuthenticationSessionPrincipalType,
    environment?: string,
) {
    if (environment === undefined) {
        const { ENVIRONMENT } = process.env;
        environment = ENVIRONMENT;
    }

    const normalizedEnvironment = environment?.trim();
    const keyPrefix = normalizedEnvironment
        ? `${applicationKeyPrefix}:${normalizedEnvironment}:`
        : `${applicationKeyPrefix}:`;

    return {
        epoch: (principalId: string) => `${keyPrefix}authenticationSessionEpoch:${principalType}:${principalId}`,
        index: (principalId: string, epoch: string) =>
            `${keyPrefix}authenticationSessions:${principalType}:${principalId}:${epoch}`,
        qrCodeLogin: (selector: string) => `${keyPrefix}authenticationSessionQrCodeLogin:${principalType}:${selector}`,
        session: (selector: string) => `${keyPrefix}authenticationSession:${principalType}:${selector}`,
    };
}
