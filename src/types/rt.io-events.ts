import type * as RtIoEventNames from '../constants/rt.io-event-names';

// eslint-disable-next-line ts/no-namespace
export namespace RtIoEvents {
    export interface ToAdminFrontend {}

    export interface ToManagementBackend {}

    export interface ToServer {
        [RtIoEventNames.ToServer.Test]: () => void;
    }
}
