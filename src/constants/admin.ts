import type { ReadonlyRecord } from '@kikiutils/shared/types';

import type { LocalizedMessages } from '../types/i18n';

export enum AdminLogType {
    LoginFailure = 0,
    LoginSuccess = 1,

    // Values below 1000 are reserved for upstream shared base types.
    // Downstream projects must assign project-specific values starting at 1000.
    // Uncomment the eslint-disable/enable lines below if `eslint --fix` would reorder these values.
    // /* eslint-disable perfectionist/sort-enums */

    // /* eslint-enable perfectionist/sort-enums */
}

export const adminLogTypeToLabelMap: ReadonlyRecord<AdminLogType, LocalizedMessages> = {
    [AdminLogType.LoginFailure]: {
        'en': 'Login failed',
        'zh-TW': '登入失敗',
    },
    [AdminLogType.LoginSuccess]: {
        'en': 'Login succeeded',
        'zh-TW': '登入成功',
    },
};
