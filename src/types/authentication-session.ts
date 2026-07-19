import type {
    AuthenticationSessionData,
    AuthenticationSessionListItemData,
} from './data/authentication-session';

export type AuthenticationSessionPrincipalType = 'admin';

/**
 * Must fail closed using authoritative state and verify that the principal exists, may authenticate,
 * and still has the supplied revision. Security mutations must atomically increment that revision and
 * revoke existing sessions; a request that already completed validation may finish as an in-flight request.
 */
export type AuthenticationSessionPrincipalValidator = (data: AuthenticationSessionPrincipalValidationData) => Promise<
    boolean
>;

export type AuthenticationSessionQrCodeLoginCompletionResult =
  | (AuthenticationSessionIssuanceResult & { state: 'completed' })
  | { state: 'pending' };

export interface ApproveAuthenticationSessionQrCodeLoginInput {
    approvalToken: string;
    sourceSession: AuthenticationSessionData;
}

export interface AuthenticateAuthenticationSessionInput {
    ip: string;
    now?: number;
    token: string;
    validatePrincipal: AuthenticationSessionPrincipalValidator;
}

export interface AuthenticationSessionIssuanceResult {
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
    principalType: AuthenticationSessionPrincipalType;
}

export interface AuthenticationSessionQrCodeLoginApprovalRequest {
    expiresAt: number;
    state: 'approved' | 'pending';
    targetIp: string;
    targetUserAgent?: string;
}

export interface AuthenticationSessionQrCodeLoginCreationResult {
    approvalToken: string;
    completionToken: string;
    expiresAt: number;
}

export interface AuthenticationSessionQrCodeLoginStore {
    approve: (input: ApproveAuthenticationSessionQrCodeLoginInput) => Promise<boolean>;
    cancel: (completionToken: string) => Promise<boolean>;
    complete: (input: CompleteAuthenticationSessionQrCodeLoginInput) => Promise<
        AuthenticationSessionQrCodeLoginCompletionResult | undefined
    >;

    create: (input: CreateAuthenticationSessionQrCodeLoginInput) => Promise<
        AuthenticationSessionQrCodeLoginCreationResult
    >;

    getApprovalRequest: (approvalToken: string) => Promise<AuthenticationSessionQrCodeLoginApprovalRequest | undefined>;
}

export interface AuthenticationSessionStore extends AuthenticationSessionManager {
    authenticate: (input: AuthenticateAuthenticationSessionInput) => Promise<AuthenticationSessionData | undefined>;
    create: (input: CreateAuthenticationSessionInput) => Promise<AuthenticationSessionIssuanceResult>;
    qrCodeLogin: AuthenticationSessionQrCodeLoginStore;
    rotate: (input: RotateAuthenticationSessionInput) => Promise<AuthenticationSessionIssuanceResult | undefined>;
}

export interface CompleteAuthenticationSessionQrCodeLoginInput {
    completionToken: string;
    ip: string;
    userAgent?: string;
    validatePrincipal: AuthenticationSessionPrincipalValidator;
}

export interface CreateAuthenticationSessionInput {
    ip: string;
    now?: number;
    principalAuthenticationRevision: number;
    principalId: string;
    userAgent?: string;
}

export interface CreateAuthenticationSessionQrCodeLoginInput {
    ip: string;
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
