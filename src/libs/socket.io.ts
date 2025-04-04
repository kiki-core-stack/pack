import type {
    DefaultEventsMap,
    EventsMap,
} from '@socket.io/component-emitter';
import { io } from 'socket.io-client';
import type {
    ManagerOptions,
    Socket,
    SocketOptions,
} from 'socket.io-client';

export function createSocketIoClient<
    ListenEvents extends EventsMap = DefaultEventsMap,
    EmitEvents extends EventsMap = ListenEvents,
>(
    uri: string,
    auth?: Partial<ManagerOptions & SocketOptions>['auth'],
    options?: Partial<ManagerOptions & SocketOptions>,
) {
    const socketIoClient: Socket<ListenEvents, EmitEvents> = io(
        uri,
        {
            auth,
            autoConnect: false,
            reconnectionDelayMax: 250,
            rejectUnauthorized: false,
            ...options,
        },
    );

    return socketIoClient;
}
