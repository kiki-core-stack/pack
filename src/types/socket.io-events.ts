import type { ToServer } from '../constants/socket.io-events';

// eslint-disable-next-line ts/no-namespace
export namespace SocketIoEvents {
    export interface ToAdminBackend {}

    export interface ToAdminFrontend {}

    export interface ToServer {
        [ToServer.Test]: () => void;
    }
}
