import type {
    Context,
    Next,
} from 'hono';

import { redisInstance } from '@/constants/redis';

import { throwApiError } from '../libs/api';

export function createReplayProtectionMiddleware(
    shouldProtect?: (ctx: Context) => boolean,
    timeoutMs: number = 5 * 1000,
    nonceMaxLength: number = 32,
    nonceRedisKeyNamespace?: ((ctx: Context) => string) | string,
    nonceRedisTtlBufferSeconds: number = 3,
) {
    return async (ctx: Context, next: Next) => {
        if (shouldProtect && !shouldProtect(ctx)) return await next();

        const timestampHeader = Number(ctx.req.header('x-timestamp'));
        if (Number.isNaN(timestampHeader)) throwApiError(400);
        if (Math.abs(Date.now() - timestampHeader) > timeoutMs) throwApiError(403, '請確認客戶端時間是否正確');

        const nonce = ctx.req.header('x-nonce');
        if (!nonce || nonce.length > nonceMaxLength) throwApiError(400);
        const nonceRedisKeyScope =
            typeof nonceRedisKeyNamespace === 'function'
                ? nonceRedisKeyNamespace(ctx)
                : nonceRedisKeyNamespace;

        const nonceRedisKey =
            nonceRedisKeyScope
                ? `replayProtectionNonce:${nonceRedisKeyScope}:${nonce}`
                : `replayProtectionNonce:${nonce}`;

        if (
            !await redisInstance.set(
                nonceRedisKey,
                '',
                'EX',
                Math.ceil(timeoutMs / 1000) + nonceRedisTtlBufferSeconds,
                'NX',
            )
        ) throwApiError(403);

        return await next();
    };
}
