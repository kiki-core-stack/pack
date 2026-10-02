import type { EmailOtpCodeType } from '../../types/otp';

import { createProjectRedisKeyedStore } from './_internals';

export const otpCode = /* @__PURE__ */ createProjectRedisKeyedStore<string>()(
    (type: EmailOtpCodeType, email: string, additionalKey?: string) => {
        let key = `email:otpCode:${type}:`;
        if (additionalKey) key += `${additionalKey}:`;
        return `${key}${email}`;
    },
);
