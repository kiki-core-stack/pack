import type * as WsIoEventNames from '../constants/ws.io-event-names';

// eslint-disable-next-line ts/no-namespace
export namespace WsIoEvents {
    export interface ToAdminFrontend {
        [WsIoEventNames.ToAdminFrontend.ForceLogout]: () => void;
    }

    export interface ToManagementBackend {}

    export interface ToOpsWorkersTs {}

    export interface ToServer {
        /**
         * 工作階段被踢除（realm 的 `onSessionsRevoked`）；ws.io-server 中斷綁在這些工作階段上的連線。
         */
        [WsIoEventNames.ToServer.AuthSessionsRevoked]: (
            realm: string,
            principalId: string,
            sessionIds: string[],
        ) => void;
    }
}
