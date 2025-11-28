import { WsIoClient } from 'ws.io-client';
import type { WsIoPacketCodec } from 'ws.io-client/core/packet/codecs';
import type {
    DefaultEventsMap,
    EventsMap,
} from 'ws.io-client/types';
import type { WsIoClientConfig } from 'ws.io-client/types/config';

export async function createWsIoClient<
    ToServerEvents extends EventsMap = DefaultEventsMap,
    ToClientEvents extends EventsMap = DefaultEventsMap,
>(url: string, config?: Partial<WsIoClientConfig>) {
    let packetCodec: undefined | WsIoPacketCodec;
    if (process.env.NODE_ENV === 'production') {
        packetCodec = (await import('ws.io-client/core/packet/codecs/msgpack')).wsIoPacketMsgpackCodec;
    }

    return new WsIoClient<ToServerEvents, ToClientEvents>(
        url,
        {
            packetCodec,
            reconnectDelay: 125,
            ...config,
        },
    );
}
