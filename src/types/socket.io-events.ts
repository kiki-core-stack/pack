import type { SocketIoEvent } from '@/constants/socket.io-event';

// eslint-disable-next-line ts/no-namespace
export namespace SocketIoEvents {
	export interface ToAdminBackend {}

	export interface ToAdminFrontend {}

	export interface ToServer {
		[SocketIoEvent.ToServer.Test]: () => void;
	}
}
