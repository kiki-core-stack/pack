import { WsIoClient } from 'ws.io-client';
import { wsIoPacketMsgpackCodec } from 'ws.io-client/core/packet/codecs/msgpack';
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
            packetCodec: wsIoPacketMsgpackCodec,
            reconnectDelay: 125,
            ...config,
        },
    );
}
