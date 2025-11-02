import { mongooseConnections } from '@kikiutils/mongoose/constants';
import { generateWithNestedRandomLength } from '@kikiutils/shared/random';
import { consola as logger } from 'consola';
import { nanoid } from 'nanoid';

import { AdminModel } from './models/admin';

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

    // Default data init
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

        // Run other initialization tasks
    });

    // Run other initialization tasks

    logger.success('System initialized and ready');
}
