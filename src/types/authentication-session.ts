import type {
    AuthenticationSessionData,
    AuthenticationSessionListItemData,
} from './data/authentication-session';

/**
 * Must fail closed using authoritative state and verify that the principal exists, may authenticate,
 * and still has the supplied revision. Security mutations must atomically increment that revision and
 * revoke existing sessions; a request that already completed validation may finish as an in-flight request.
 */
export type AuthenticationSessionPrincipalValidator = (
    data: AuthenticationSessionPrincipalValidationData,
) => Promise<boolean>;

export interface AuthenticateAuthenticationSessionInput {
    ip: string;
    now?: number;
    token: string;
    validatePrincipal: AuthenticationSessionPrincipalValidator;
}

interface AuthenticationSessionIssuanceResult {
    cookieMaxAgeSeconds: number;
    session: AuthenticationSessionData;
    token: string;
}

export interface AuthenticationSessionManager {
    list: (input: ListAuthenticationSessionsInput) => Promise<AuthenticationSessionListItemData[]>;
    revoke: (sessionId: string) => Promise<boolean>;
    revokeAll: (principalId: string) => Promise<void>;
}

export interface AuthenticationSessionPrincipalValidationData {
    principalAuthenticationRevision: number;
    principalId: string;
    principalType: AuthenticationSessionData['principalType'];
}

export interface AuthenticationSessionStore extends AuthenticationSessionManager {
    authenticate: (input: AuthenticateAuthenticationSessionInput) => Promise<AuthenticationSessionData | undefined>;
    create: (input: CreateAuthenticationSessionInput) => Promise<AuthenticationSessionIssuanceResult>;
    rotate: (input: RotateAuthenticationSessionInput) => Promise<AuthenticationSessionIssuanceResult | undefined>;
}

export interface CreateAuthenticationSessionInput {
    ip: string;
    now?: number;
    principalAuthenticationRevision: number;
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
