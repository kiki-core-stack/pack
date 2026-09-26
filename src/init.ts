import { mongooseConnections } from '@kikiutils/mongoose/constants';
import { generateWithNestedRandomLength } from '@kikiutils/shared/random';
import { consola as logger } from 'consola';
import { nanoid } from 'nanoid';

import { redisClient } from './constants/redis';
import { AdminModel } from './models/admin';
import { EmailProviderModel } from './models/email/provider';
import { SmsProviderModel } from './models/sms/provider';

const sleep = (durationMs: number) => new Promise((resolve) => void setTimeout(resolve, durationMs));

export async function initializeSystemStartup() {
    logger.info('Initializing startup...');

    logger.info('Waiting for MongoDB connection...');
    const startAt = Date.now();
    while (mongooseConnections.default?.readyState !== 1) {
        if (Date.now() - startAt > 10000) return logger.error('Database connection timed out after 10 seconds');
        if (mongooseConnections.default?.readyState === 2) await sleep(50);
        else await sleep(1000);
    }

    logger.success('Database connected');

    // Run default initialization tasks with redis lock
    // TODO: 此處應該改方法 避免初始化完成之前其餘服務或thread直接跳過這個lock進入service ready的錯誤狀態
    // 或是正式環境時需要由一個init docker startup container/image開始執行
    const locked = await redisClient.send(
        'SET',
        [
            'system:initialize',
            '1',
            'EX',
            '10',
            'NX',
        ],
    );

    if (locked) {
        await mongooseConnections.default!.transaction(async (session) => {
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

            // Others downstream projects tasks with session
        });

        // Run other initialization tasks

        // 2026-07-20 backfill the initial authentication revision for admins
        // created before session revision tracking
        AdminModel.updateMany(
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
