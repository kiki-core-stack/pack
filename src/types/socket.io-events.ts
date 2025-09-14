import type * as SocketIoEventNames from '@/constants/socket.io-event-names';

// eslint-disable-next-line ts/no-namespace
export namespace SocketIoEvents {
    export interface ToAdminBackend {}

    export interface ToAdminFrontend {}

    export interface ToServer {
        [SocketIoEventNames.ToServer.Test]: () => void;
    }
}
