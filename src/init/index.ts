import { getDefaultMongooseConnection } from '@kikiutils/mongoose/connection';
import { EnhancedDate } from '@kikiutils/shared/classes/enhanced-date';

import { projectRedisKeyPrefix } from '../constants';
import { logger } from '../libs/_logger';
import { tryClaimRedisKey } from '../libs/redis/lock';

export async function initializeSystemStartup() {
    logger.info('Initializing startup...');

    logger.info('Waiting for MongoDB connection...');
    const mongooseConnection = getDefaultMongooseConnection();
    const deadline = new EnhancedDate().addSeconds(10);
    while (mongooseConnection.readyState !== 1) {
        if (deadline.isBefore(EnhancedDate.now())) {
            throw new Error('Database connection timed out after 10 seconds');
        }

        if (mongooseConnection.readyState === 2) await Bun.sleep(50);
        else await Bun.sleep(1000);
    }

    logger.success('Database connected');

    // Run default initialization tasks with redis lock

    // TODO: 此處應該改方法 避免初始化完成之前其餘服務或thread直接跳過這個lock進入service ready的錯誤狀態
    // 或是正式環境時需要由一個init docker startup container/image開始執行
    const locked = await tryClaimRedisKey(`${projectRedisKeyPrefix}:system:initialize`, 10 * 1000);
    if (locked) {
        await mongooseConnection.transaction(async (session) => {
            const admin = await (await import('./tasks/kcs/ensure-admin')).run(session);
            await (await import('./tasks/kcs/ensure-platform-configs')).run(session, admin._id);

            // Others downstream projects tasks with session
        });

        await (await import('./tasks/kcs/20260720-backfill-admin-authentication-revision')).run();
        await (await import('./tasks/kcs/sync-provider-indexes')).run();

        // Others downstream projects tasks
    }

    logger.success('System initialized and ready');
}
