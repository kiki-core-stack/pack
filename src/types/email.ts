// eslint-disable-next-line ts/no-namespace
export namespace EmailPlatformConfigs {
    export interface Smtp {
        host: string;
        password?: string;
        port: number;
        secure: boolean;
        tls: {
            rejectUnauthorized: boolean;
            required: boolean;
        };

        username?: string;
    }
}
