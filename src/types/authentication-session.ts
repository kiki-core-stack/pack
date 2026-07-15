import type {
    AuthenticationSessionData,
    AuthenticationSessionListItemData,
} from './data/authentication-session';

export interface AuthenticateAuthenticationSessionInput {
    ip: string;
    now?: number;
    token: string;
}

interface AuthenticationSessionAuthenticationResult {
    refreshedTtlSeconds?: number;
    session: AuthenticationSessionData;
}

interface AuthenticationSessionCreationResult {
    session: AuthenticationSessionData;
    token: string;
    ttlSeconds: number;
}

export interface AuthenticationSessionListResult {
    count: number;
    list: AuthenticationSessionListItemData[];
}

export interface AuthenticationSessionStore {
    authenticate: (input: AuthenticateAuthenticationSessionInput) => Promise<
        AuthenticationSessionAuthenticationResult | undefined
    >;

    create: (input: CreateAuthenticationSessionInput) => Promise<AuthenticationSessionCreationResult>;
    list: (input: ListAuthenticationSessionsInput) => Promise<AuthenticationSessionListResult>;
    revoke: (input: RevokeAuthenticationSessionInput) => Promise<boolean>;
    revokeAll: (principalId: string) => Promise<void>;
    rotate: (input: RotateAuthenticationSessionInput) => Promise<AuthenticationSessionCreationResult | undefined>;
}

export interface CreateAuthenticationSessionInput {
    ip: string;
    now?: number;
    principalId: string;
    userAgent?: string;
}

export interface ListAuthenticationSessionsInput {
    currentSessionId?: string;
    now?: number;
    principalId: string;
}

export interface RevokeAuthenticationSessionInput {
    principalId: string;
    sessionId: string;
}

export interface RotateAuthenticationSessionInput extends AuthenticateAuthenticationSessionInput {
    principalId: string;
    userAgent?: string;
}
