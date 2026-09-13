// eslint-disable-next-line ts/no-namespace
export namespace SmsProviderConfigs {
    export interface Mitake {
        apiUrl: string;
        encoding: 'UTF8';
        password: string;
        username: string;
    }

    export interface TwSms {
        apiUrl: string;
        password: string;
        username: string;
    }
}
