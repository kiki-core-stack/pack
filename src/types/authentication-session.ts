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

export interface AuthenticationSessionManager {
    list: (input: ListAuthenticationSessionsInput) => Promise<AuthenticationSessionListResult>;
    revoke: (sessionId: string) => Promise<boolean>;
    revokeAll: (principalId: string) => Promise<void>;
}

export interface AuthenticationSessionStore extends AuthenticationSessionManager {
    authenticate: (input: AuthenticateAuthenticationSessionInput) => Promise<
        AuthenticationSessionAuthenticationResult | undefined
    >;

    create: (input: CreateAuthenticationSessionInput) => Promise<AuthenticationSessionCreationResult>;
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

export interface RotateAuthenticationSessionInput extends AuthenticateAuthenticationSessionInput {
    principalId: string;
    userAgent?: string;
}
