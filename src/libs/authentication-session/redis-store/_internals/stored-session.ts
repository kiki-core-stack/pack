import type { AuthenticationSessionPrincipalType } from '../../../../types/authentication-session';
import type { AuthenticationSessionData } from '../../../../types/data/authentication-session';

// Types
interface StoredAuthenticationSessionData extends AuthenticationSessionData {
    validatorDigest: string;
}

// Constants
export const storedAuthenticationSessionDataFields = [
    'absoluteExpiresAt',
    'epoch',
    'id',
    'lastActiveAt',
    'lastActiveIp',
    'loggedAt',
    'loginIp',
    'principalAuthenticationRevision',
    'principalId',
    'principalType',
    'userAgent',
] as const;

export const storedAuthenticationSessionFields = [
    ...storedAuthenticationSessionDataFields,
    'validatorDigest',
] as const;

// Functions
export function parseStoredAuthenticationSession(
    values: (null | string)[],
    expectedPrincipalType: AuthenticationSessionPrincipalType,
): StoredAuthenticationSessionData | undefined {
    const session = parseStoredAuthenticationSessionData(values, expectedPrincipalType);
    const validatorDigest = values[storedAuthenticationSessionDataFields.length];
    if (!session || validatorDigest == null) return;

    return {
        ...session,
        validatorDigest,
    };
}

export function parseStoredAuthenticationSessionData(
    values: (null | string)[],
    expectedPrincipalType: AuthenticationSessionPrincipalType,
): AuthenticationSessionData | undefined {
    const [
        absoluteExpiresAt,
        epoch,
        id,
        lastActiveAt,
        lastActiveIp,
        loggedAt,
        loginIp,
        principalAuthenticationRevision,
        principalId,
        principalType,
        userAgent,
    ] = values;

    if (
        absoluteExpiresAt == null
        || epoch == null
        || id == null
        || lastActiveAt == null
        || lastActiveIp == null
        || loggedAt == null
        || loginIp == null
        || principalAuthenticationRevision == null
        || principalId == null
        || principalType !== expectedPrincipalType
    ) return;

    const parsedAbsoluteExpiresAt = Number(absoluteExpiresAt);
    const parsedLastActiveAt = Number(lastActiveAt);
    const parsedLoggedAt = Number(loggedAt);
    const parsedPrincipalAuthenticationRevision = Number(principalAuthenticationRevision);
    if (
        !Number.isSafeInteger(parsedAbsoluteExpiresAt)
        || parsedAbsoluteExpiresAt < 0
        || !Number.isSafeInteger(parsedLastActiveAt)
        || parsedLastActiveAt < 0
        || !Number.isSafeInteger(parsedLoggedAt)
        || parsedLoggedAt < 0
        || !Number.isSafeInteger(parsedPrincipalAuthenticationRevision)
        || parsedPrincipalAuthenticationRevision < 0
    ) return;

    return {
        absoluteExpiresAt: parsedAbsoluteExpiresAt,
        epoch,
        id,
        lastActiveAt: parsedLastActiveAt,
        lastActiveIp,
        loggedAt: parsedLoggedAt,
        loginIp,
        principalAuthenticationRevision: parsedPrincipalAuthenticationRevision,
        principalId,
        principalType,
        userAgent: userAgent || undefined,
    };
}
