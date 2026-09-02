import { WsIoClient } from 'ws.io-client';
import type {
    DefaultEventsMap,
    EventsMap,
} from 'ws.io-client/types';
import type { WsIoClientConfig } from 'ws.io-client/types/config';

export function createWsIoClient<
    ToServerEvents extends EventsMap = DefaultEventsMap,
    ToClientEvents extends EventsMap = DefaultEventsMap,
>(url: string, config?: Partial<WsIoClientConfig>) {
    return new WsIoClient<ToServerEvents, ToClientEvents>(
        url,
        {
            reconnectDelay: 125,
            ...config,
        },
    );
}
