import { getEnumNumberValues } from '@kikiutils/shared/enum';

export enum CommonStatus {
    Aborted = 0,
    Active = 15,
    Approved = 8,
    Attached = 16,
    Available = 13,
    AwaitingPayment = 10,
    Cancelled = 1,
    Completed = 11,
    Created = 17,
    DeadLettered = 32,
    Deleted = 18,
    DeliveryStatusUnknown = 31,
    Draft = 19,
    Expired = 20,
    Failed = 2,
    Hidden = 21,
    Idle = 12,
    Pending = 3,
    PendingReview = 22,
    Processing = 4,
    Provisioning = 23,
    Published = 24,
    Ready = 25,
    Rejected = 9,
    Released = 26,
    Returned = 14,
    Running = 27,
    Settled = 6,
    Skipped = 28,
    Succeeded = 7,
    ThirdPartyProcessing = 5,
    Unknown = 29,
    Uploading = 30,

    // Values below 1000 are reserved for upstream shared base types.
    // Downstream projects must assign project-specific values starting at 1000.
    // Uncomment the eslint-disable/enable lines below if `eslint --fix` would reorder these values.
    // /* eslint-disable perfectionist/sort-enums */

    // /* eslint-enable perfectionist/sort-enums */
}

export const commonStatuses: readonly CommonStatus[] = getEnumNumberValues(CommonStatus);

/**
 * Fixed Redis key prefix for this project.
 * Projects forked from the base pack must replace it with their own prefix.
 */
export const projectRedisKeyPrefix = 'kiki-core-stack';
