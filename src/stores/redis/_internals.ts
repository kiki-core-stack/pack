import { createRedisKeyedStore } from '@kikiutils/shared/storages/redis/keyed-store';

import { projectRedisKeyPrefix } from '../../constants';
import { redisMsgpackStorage } from '../../storages/redis/msgpack';

export function createProjectRedisKeyedStore<D = unknown>() {
    return <P extends any[]>(keyFn: (...args: P) => string) => createRedisKeyedStore<D>(redisMsgpackStorage)(
        (...args: P) => `${projectRedisKeyPrefix}:${keyFn(...args)}`,
    );
}
