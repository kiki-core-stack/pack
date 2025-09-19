import { mongooseConnections } from '@kikiutils/mongoose/constants';
import { generateWithNestedRandomLength } from '@kikiutils/shared/random';
import { consola as logger } from 'consola';
import { nanoid } from 'nanoid';

import { argon2HashPassword } from './libs/password-argon2';
import { AdminModel } from './models/admin';

const sleep = (durationMs: number) => new Promise((resolve) => void setTimeout(resolve, durationMs));

export async function initializeSystemDefaults() {
    logger.info('Initializing system defaults...');

    logger.info('Waiting for database connection...');
    const startAt = Date.now();
    while (mongooseConnections.default?.readyState !== 1) {
        if (Date.now() - startAt > 10000) return logger.error('Database connection timed out after 10 seconds');
        if (mongooseConnections.default?.readyState === 2) await sleep(50);
        else await sleep(1000);
    }

    logger.success('Database connected successfully');

    // Create default data
    await mongooseConnections.default!.transaction(async (session) => {
        let admin = await AdminModel.findOne({}, undefined, { session });
        if (!admin) {
            logger.info('No admin found, creating a new one...');
            const password = generateWithNestedRandomLength(nanoid, 16, 32, 48, 64);
            admin = (await AdminModel.create(
                [
                    {
                        account: 'admin',
                        enabled: true,
                        password: await argon2HashPassword(password),
                    },
                ],
                { session },
            ))[0]!;

            logger.info(`Admin created with account: ${admin.account}, password: ${password}`);
        }

        // Run other initialization tasks
    });

    // Run other initialization tasks

    logger.success('System defaults initialized successfully');
}
