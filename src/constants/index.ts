import { getEnumNumberValues } from '@kikiutils/shared/enum';
import type { ReadonlyRecord } from '@kikiutils/shared/types';

export enum CommonStatus {
    Aborted = 0,
    Approved = 8,
    Available = 13,
    Cancelled = 1,
    Completed = 11,
    Failed = 2,
    Idle = 12,
    Pending = 3,
    Processing = 4,
    ProcessingByThirdParty = 5,
    Rejected = 9,
    Returned = 14,
    Settled = 6,
    Success = 7,
    ToBePaid = 10,
}

export const commonStatuses: readonly CommonStatus[] = getEnumNumberValues(CommonStatus);
export const commonStatusToTextMap: ReadonlyRecord<CommonStatus, string> = {
    [CommonStatus.Aborted]: '已中止',
    [CommonStatus.Approved]: '已通過',
    [CommonStatus.Available]: '可使用',
    [CommonStatus.Cancelled]: '已取消',
    [CommonStatus.Completed]: '已完成',
    [CommonStatus.Failed]: '失敗',
    [CommonStatus.Idle]: '閒置',
    [CommonStatus.Pending]: '待處理',
    [CommonStatus.Processing]: '處理中',
    [CommonStatus.ProcessingByThirdParty]: '三方處理中',
    [CommonStatus.Rejected]: '已拒絕',
    [CommonStatus.Returned]: '已退回',
    [CommonStatus.Settled]: '已結算',
    [CommonStatus.Success]: '成功',
    [CommonStatus.ToBePaid]: '待付款',
};

export const isDebugMode = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
