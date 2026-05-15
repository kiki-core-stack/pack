import type * as WsIoEventNames from '../constants/ws.io-event-names';

// eslint-disable-next-line ts/no-namespace
export namespace WsIoEvents {
    export interface ToAdminFrontend {}

    export interface ToManagementBackend {}

    export interface ToServer {
        [WsIoEventNames.ToServer.Test]: () => void;
    }
}
