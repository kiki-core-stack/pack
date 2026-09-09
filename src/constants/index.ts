import { getEnumNumberValues } from '@kikiutils/shared/enum';
import type { ReadonlyRecord } from '@kikiutils/shared/types';

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

    // Values below 1000 are reserved for shared statuses.
    // Downstream projects must assign project-specific statuses values starting at 1000.
    // /* eslint-disable perfectionist/sort-enums */

    // /* eslint-enable perfectionist/sort-enums */
}

export const commonStatuses: readonly CommonStatus[] = getEnumNumberValues(CommonStatus);
export const commonStatusToTextMap: ReadonlyRecord<CommonStatus, string> = {
    [CommonStatus.Aborted]: '已中止',
    [CommonStatus.Active]: '啟用中',
    [CommonStatus.Approved]: '已通過',
    [CommonStatus.Attached]: '已附加',
    [CommonStatus.Available]: '可使用',
    [CommonStatus.AwaitingPayment]: '待付款',
    [CommonStatus.Cancelled]: '已取消',
    [CommonStatus.Completed]: '已完成',
    [CommonStatus.Created]: '已建立',
    [CommonStatus.Deleted]: '已刪除',
    [CommonStatus.DeliveryStatusUnknown]: '送達狀態未知',
    [CommonStatus.Draft]: '草稿',
    [CommonStatus.Expired]: '已過期',
    [CommonStatus.Failed]: '失敗',
    [CommonStatus.Hidden]: '已隱藏',
    [CommonStatus.Idle]: '閒置',
    [CommonStatus.Pending]: '待處理',
    [CommonStatus.PendingReview]: '待核實',
    [CommonStatus.Processing]: '處理中',
    [CommonStatus.Provisioning]: '配置中',
    [CommonStatus.Published]: '已發布',
    [CommonStatus.Ready]: '已就緒',
    [CommonStatus.Rejected]: '已拒絕',
    [CommonStatus.Released]: '已釋放',
    [CommonStatus.Returned]: '已退回',
    [CommonStatus.Running]: '執行中',
    [CommonStatus.Settled]: '已結算',
    [CommonStatus.Skipped]: '已跳過',
    [CommonStatus.Succeeded]: '成功',
    [CommonStatus.ThirdPartyProcessing]: '三方處理中',
    [CommonStatus.Unknown]: '未知',
    [CommonStatus.Uploading]: '上傳中',
};

/**
 * Fixed Redis key prefix for this project.
 * Projects forked from the base pack must replace it with their own prefix.
 */
export const projectRedisKeyPrefix = 'kiki-core-stack';
