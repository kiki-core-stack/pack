import { getDefaultMongooseConnection } from '@kikiutils/mongoose/connection';
import { EnhancedDate } from '@kikiutils/shared/classes/enhanced-date';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import { generateWithNestedRandomLength } from '@kikiutils/shared/random';
import { delay } from '@kikiutils/shared/time';
import { consola as logger } from 'consola';
import { nanoid } from 'nanoid';

import { projectRedisKeyPrefix } from './constants';
import {
    defaultPlatformConfigs,
    PlatformConfigScope,
} from './constants/platform';
import { redisClient } from './constants/redis';
import { AdminModel } from './models/admin';
import { EmailProviderModel } from './models/email/provider';
import { PlatformConfigModel } from './models/platform/config';
import { SmsProviderModel } from './models/sms/provider';

export async function initializeSystemStartup() {
    logger.info('Initializing startup...');

    logger.info('Waiting for MongoDB connection...');
    const mongooseConnection = getDefaultMongooseConnection();
    const deadline = new EnhancedDate().addSeconds(10);
    while (mongooseConnection.readyState !== 1) {
        if (deadline.isBefore(EnhancedDate.now())) {
            return logger.error('Database connection timed out after 10 seconds');
        }

        if (mongooseConnection.readyState === 2) await delay(50);
        else await delay(1000);
    }

    logger.success('Database connected');

    // Run default initialization tasks with redis lock
    // TODO: 此處應該改方法 避免初始化完成之前其餘服務或thread直接跳過這個lock進入service ready的錯誤狀態
    // 或是正式環境時需要由一個init docker startup container/image開始執行
    const locked = await redisClient.set(`${projectRedisKeyPrefix}:system:initialize`, '1', 'EX', '10', 'NX');
    if (locked) {
        await mongooseConnection.transaction(async (session) => {
            let admin = await AdminModel.findOne({}, undefined, { session });
            if (!admin) {
                logger.box('No admin found → creating default super admin');
                const password = generateWithNestedRandomLength(nanoid, 16, 32, 48, 64);
                admin = (await AdminModel.create(
                    [
                        {
                            account: 'admin',
                            enabled: true,
                            isSuperAdmin: true,
                            password,
                        },
                    ],
                    { session },
                ))[0]!;

                logger.info(`Admin created: ${admin.account}`);
                logger.info(`Temporary password: ${password}`);
            }

            // Run other initialization tasks with session

            // Create default platform configs
            for (const platformConfigScope of getEnumNumberValues(PlatformConfigScope)) {
                const now = new EnhancedDate();
                await PlatformConfigModel.updateOne(
                    { scope: platformConfigScope },
                    {
                        $setOnInsert: {
                            config: defaultPlatformConfigs[platformConfigScope],
                            createdAt: now,
                            createdByAdmin: admin._id,
                            updatedAt: now,
                        },
                    },
                    {
                        session,
                        timestamps: false,
                        upsert: true,
                    },
                );
            }

            // Others downstream projects tasks with session
        });

        // Run other initialization tasks

        // 2026-07-20 backfill the initial authentication revision for admins
        // created before session revision tracking
        await AdminModel.updateMany(
            { authenticationRevision: { $exists: false } },
            { $set: { authenticationRevision: 0 } },
        );

        // 2026-09-26 sync email and sms provider collection indexes
        await EmailProviderModel.syncIndexes();
        await SmsProviderModel.syncIndexes();

        // Others downstream projects tasks
    }

    logger.success('System initialized and ready');
}
