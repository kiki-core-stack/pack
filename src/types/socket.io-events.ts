import type * as SocketIoEventNames from '../constants/socket.io-event-names';

// eslint-disable-next-line ts/no-namespace
export namespace SocketIoEvents {
    export interface ToManagementSystemBackend {}

    export interface ToManagementSystemFrontend {}

    export interface ToServer {
        [SocketIoEventNames.ToServer.Test]: () => void;
    }
}
