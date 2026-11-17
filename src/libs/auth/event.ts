import { AuthEventModel } from '../../models/auth/event';
import type {
    AuthPrincipal,
    RecordAuthEventInput,
} from '../../types/auth';
import { logger } from '../_internals/logger';

import type { AuthRealm } from './realm';

// Constants
const maxAuthUserAgentLength = 512;

// Functions

/**
 * 寫入驗證事件並呼叫 realm 的 `onEvent`。寫入或回呼失敗只記錄錯誤，不讓原本的操作失敗。
 */
export async function recordAuthEvent<P extends AuthPrincipal>(realm: AuthRealm<P>, input: RecordAuthEventInput) {
    try {
        await AuthEventModel.create({
            actorPrincipalId: input.actor?.principalId ?? input.principalId,
            actorRealm: input.actor?.realm ?? realm.name,
            factor: input.factor,
            ip: input.request?.ip,
            metadata: input.metadata,
            principalId: input.principalId,
            realm: realm.name,
            sessionId: input.sessionId,
            type: input.type,
            userAgent: truncateAuthUserAgent(input.request?.userAgent),
        });

        await realm.onEvent?.({
            ...input,
            realm: realm.name,
        });
    } catch (error) {
        logger.error(
            'Failed to record auth event',
            {
                error,
                realm: realm.name,
                type: input.type,
            },
        );
    }
}

/**
 * User-Agent 由用戶端決定，儲存前截斷以免被用來灌大資料。
 */
export function truncateAuthUserAgent(userAgent?: string) {
    return userAgent?.slice(0, maxAuthUserAgentLength) || undefined;
}
