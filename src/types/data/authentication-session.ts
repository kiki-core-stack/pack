import type { Except } from 'type-fest';

export type AuthenticationSessionData = Except<StoredAuthenticationSessionData, 'validatorDigest'>;
export type AuthenticationSessionListItemData = AuthenticationSessionData & { isCurrent: boolean };
export type AuthenticationSessionPrincipalType = 'admin';

export interface StoredAuthenticationSessionData {
    absoluteExpiresAt: number;
    epoch: string;
    id: string;
    lastActiveAt: number;
    lastActiveIp: string;
    loggedAt: number;
    loginIp: string;
    principalId: string;
    principalType: AuthenticationSessionPrincipalType;
    userAgent?: string;
    validatorDigest: string;
}
