import { WsIoClient } from 'ws.io-client';
import * as wsIoPacketMsgpackCodec from 'ws.io-client/core/packet/codecs/msgpack';
import type { WsIoClientConfig } from 'ws.io-client/types/config';

import { isDebugMode } from '../constants';

export function createWsIoClient<
    ToServerEvents extends Record<string, (...args: any[]) => any> = Record<string, never>,
    ToClientEvents extends Record<string, (...args: any[]) => any> = Record<string, never>,
>(url: string, config?: Partial<WsIoClientConfig>) {
    return new WsIoClient<ToServerEvents, ToClientEvents>(
        url,
        {
            packetCodec: !isDebugMode ? wsIoPacketMsgpackCodec : undefined,
            reconnectDelay: 125,
            ...config,
        },
    );
}
