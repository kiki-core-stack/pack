// import type {
//     DefaultEventsMap,
//     EventsMap,
// } from '@socket.io/component-emitter';
// import { io } from 'socket.io-client';
// import type {
//     ManagerOptions,
//     Socket,
//     SocketOptions,
// } from 'socket.io-client';
// import * as msgpackParser from 'socket.io-msgpack-parser';

// export function createSocketIoClient<
//     ListenEvents extends EventsMap = DefaultEventsMap,
//     EmitEvents extends EventsMap = ListenEvents,
// >(
//     uri: string,
//     auth?: Partial<ManagerOptions & SocketOptions>['auth'],
//     options?: Partial<ManagerOptions & SocketOptions>,
//     forceUseJsonParser?: boolean,
// ) {
//     forceUseJsonParser ??= process.env.SOCKET_IO_FORCE_USE_JSON_PARSER === 'true';
//     const socketIoClient: Socket<ListenEvents, EmitEvents> = io(
//         uri,
//         {
//             auth,
//             autoConnect: false,
//             parser: !forceUseJsonParser && process.env.NODE_ENV === 'production' ? msgpackParser : undefined,
//             reconnectionDelayMax: 250,
//             rejectUnauthorized: false,
//             ...options,
//         },
//     );

//     return socketIoClient;
// }
