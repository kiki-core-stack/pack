import type { AuthenticationSessionPrincipalType } from '../../../types/data/authentication-session';

export function createRedisAuthenticationSessionKeys(
    principalType: AuthenticationSessionPrincipalType,
    keyPrefix: string,
) {
    return {
        epoch: (principalId: string) => `${keyPrefix}authenticationSessionEpoch:${principalType}:${principalId}`,
        index: (principalId: string, epoch: string) =>
            `${keyPrefix}authenticationSessions:${principalType}:${principalId}:${epoch}`,
        session: (selector: string) => `${keyPrefix}authenticationSession:${principalType}:${selector}`,
    };
}
