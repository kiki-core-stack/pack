import { projectRedisKeyPrefix } from '../../../constants';

// Functions
export function authRedisKey(realmName: string, ...parts: Array<number | string>) {
    return `${projectRedisKeyPrefix}:auth:${realmName}:${parts.join(':')}`;
}
