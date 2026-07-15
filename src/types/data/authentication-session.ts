export type AuthenticationSessionPrincipalType = 'admin';

export interface AuthenticationSessionData {
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
}

export interface AuthenticationSessionListItemData extends AuthenticationSessionData {
    isCurrent: boolean;
}
