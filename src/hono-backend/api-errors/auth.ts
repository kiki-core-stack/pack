import { defineApiErrors } from '../libs/api/error';

export const {
    invalidCredentials,
    sessionInvalid,
} = defineApiErrors({
    /**
     * Account not found, wrong password or disabled account alike, so responses never reveal whether an account exists.
     */
    invalidCredentials: {
        message: {
            'en': 'Incorrect account or password',
            'zh-TW': '帳號或密碼錯誤',
        },
        status: 401,
    },
    sessionInvalid: {
        message: {
            'en': 'Session expired; please log in again',
            'zh-TW': '登入已失效，請重新登入',
        },
        status: 401,
    },
});
