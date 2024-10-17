import type { SocketIoEvent } from '@/constants/socket.io-event';

export namespace SocketIoEvents {
	export interface ToAdminBackend {}

	export interface ToAdminFrontend {}

	export interface ToServer {
		[SocketIoEvent.ToServer.Test]: () => void;
	}
}
