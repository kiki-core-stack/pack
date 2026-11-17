import { projectRedisKeyPrefix } from '../../../constants';

// Functions

/**
 * auth 的 Redis key：`<projectRedisKeyPrefix>:auth:<realm>:<...parts>`。
 */
export function authRedisKey(realmName: string, ...parts: Array<number | string>) {
    return `${projectRedisKeyPrefix}:auth:${realmName}:${parts.join(':')}`;
}
