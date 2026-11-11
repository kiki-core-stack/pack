import { defineApiErrors } from '../libs/api/error';

export const { sessionInvalid } = defineApiErrors({
    sessionInvalid: {
        description: '登入狀態已失效、過期或被撤銷，需重新登入',
        status: 401,
    },
});
