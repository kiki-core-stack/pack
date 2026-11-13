import { getEnumNumberValues } from '@kikiutils/shared/enum';
import type { ReadonlyRecord } from '@kikiutils/shared/types';

import type { LocalizedMessages } from '../types/i18n';

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
export const commonStatusToLabelMap: ReadonlyRecord<CommonStatus, LocalizedMessages> = {
    [CommonStatus.Aborted]: {
        'en': 'Aborted',
        'zh-TW': '已中止',
    },
    [CommonStatus.Active]: {
        'en': 'Active',
        'zh-TW': '啟用中',
    },
    [CommonStatus.Approved]: {
        'en': 'Approved',
        'zh-TW': '已通過',
    },
    [CommonStatus.Attached]: {
        'en': 'Attached',
        'zh-TW': '已附加',
    },
    [CommonStatus.Available]: {
        'en': 'Available',
        'zh-TW': '可使用',
    },
    [CommonStatus.AwaitingPayment]: {
        'en': 'Awaiting payment',
        'zh-TW': '待付款',
    },
    [CommonStatus.Cancelled]: {
        'en': 'Cancelled',
        'zh-TW': '已取消',
    },
    [CommonStatus.Completed]: {
        'en': 'Completed',
        'zh-TW': '已完成',
    },
    [CommonStatus.Created]: {
        'en': 'Created',
        'zh-TW': '已建立',
    },
    [CommonStatus.DeadLettered]: {
        'en': 'Dead-lettered',
        'zh-TW': '已進入死信',
    },
    [CommonStatus.Deleted]: {
        'en': 'Deleted',
        'zh-TW': '已刪除',
    },
    [CommonStatus.DeliveryStatusUnknown]: {
        'en': 'Delivery status unknown',
        'zh-TW': '送達狀態未知',
    },
    [CommonStatus.Draft]: {
        'en': 'Draft',
        'zh-TW': '草稿',
    },
    [CommonStatus.Expired]: {
        'en': 'Expired',
        'zh-TW': '已過期',
    },
    [CommonStatus.Failed]: {
        'en': 'Failed',
        'zh-TW': '失敗',
    },
    [CommonStatus.Hidden]: {
        'en': 'Hidden',
        'zh-TW': '已隱藏',
    },
    [CommonStatus.Idle]: {
        'en': 'Idle',
        'zh-TW': '閒置',
    },
    [CommonStatus.Pending]: {
        'en': 'Pending',
        'zh-TW': '待處理',
    },
    [CommonStatus.PendingReview]: {
        'en': 'Pending review',
        'zh-TW': '待核實',
    },
    [CommonStatus.Processing]: {
        'en': 'Processing',
        'zh-TW': '處理中',
    },
    [CommonStatus.Provisioning]: {
        'en': 'Provisioning',
        'zh-TW': '配置中',
    },
    [CommonStatus.Published]: {
        'en': 'Published',
        'zh-TW': '已發布',
    },
    [CommonStatus.Ready]: {
        'en': 'Ready',
        'zh-TW': '已就緒',
    },
    [CommonStatus.Rejected]: {
        'en': 'Rejected',
        'zh-TW': '已拒絕',
    },
    [CommonStatus.Released]: {
        'en': 'Released',
        'zh-TW': '已釋放',
    },
    [CommonStatus.Returned]: {
        'en': 'Returned',
        'zh-TW': '已退回',
    },
    [CommonStatus.Running]: {
        'en': 'Running',
        'zh-TW': '執行中',
    },
    [CommonStatus.Settled]: {
        'en': 'Settled',
        'zh-TW': '已結算',
    },
    [CommonStatus.Skipped]: {
        'en': 'Skipped',
        'zh-TW': '已跳過',
    },
    [CommonStatus.Succeeded]: {
        'en': 'Succeeded',
        'zh-TW': '成功',
    },
    [CommonStatus.ThirdPartyProcessing]: {
        'en': 'Third-party processing',
        'zh-TW': '三方處理中',
    },
    [CommonStatus.Unknown]: {
        'en': 'Unknown',
        'zh-TW': '未知',
    },
    [CommonStatus.Uploading]: {
        'en': 'Uploading',
        'zh-TW': '上傳中',
    },
};

/**
 * Fixed Redis key prefix for this project.
 * Projects forked from the base pack must replace it with their own prefix.
 */
export const projectRedisKeyPrefix = 'kiki-core-stack';
