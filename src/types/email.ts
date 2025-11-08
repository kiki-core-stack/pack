// eslint-disable-next-line ts/no-namespace
export namespace EmailPlatformConfigs {
    export interface Smtp {
        host: string;
        password?: string;
        port: number;
        requireTls: boolean;
        secure: boolean;
        username?: string;
    }
}
