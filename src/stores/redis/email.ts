import { createRedisKeyedStore } from '@kikiutils/shared/storages/redis/keyed-store';

import { redisMsgpackStorage } from '../../storages/redis/msgpack';
import type { EmailOtpCodeType } from '../../types/otp';

export const emailOtpCode = /* @__PURE__ */ createRedisKeyedStore<string>(redisMsgpackStorage)(
    (type: EmailOtpCodeType, email: string, additionalKey?: string) => {
        let key = `emailOtpCode:${type}:`;
        if (additionalKey) key += `${additionalKey}:`;
        return `${key}${email}`;
    },
);
