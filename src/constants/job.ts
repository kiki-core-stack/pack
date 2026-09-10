import { CommonStatus } from '.';

export enum JobOutboxEventStatus {
    DeadLettered = CommonStatus.DeadLettered,
    Pending = CommonStatus.Pending,
}

export enum JobType {
    SendEmail = 0,

    // Values below 1000 are reserved for shared job types.
    // Downstream projects must assign project-specific job types values starting at 1000.
    // /* eslint-disable perfectionist/sort-enums */

    // /* eslint-enable perfectionist/sort-enums */
}
