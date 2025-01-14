import logger from '@kikiutils/node/consola';
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

export function createSocketIoClient<ListenEvents extends EventsMap = DefaultEventsMap, EmitEvents extends EventsMap = ListenEvents>(uri: string, auth?: Partial<ManagerOptions & SocketOptions>['auth'], options?: Partial<ManagerOptions & SocketOptions>) {
    const socketIoClient = io(
        uri,
        {
            auth,
            autoConnect: false,
            reconnectionDelayMax: 250,
            rejectUnauthorized: false,
            ...options,
        },
    ) as Socket<ListenEvents, EmitEvents>;

    socketIoClient.on('connect', () => logger.info('socket.io已連線'));
    socketIoClient.on('connect_error', (error) => logger.error('socket.io連線錯誤：', error));
    socketIoClient.on('disconnect', () => logger.info('socket.io已斷線'));
    return socketIoClient;
}
