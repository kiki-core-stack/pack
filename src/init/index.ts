import { getDefaultMongooseConnection } from '@kikiutils/mongoose/connection';
import { withTimeout } from 'es-toolkit/promise';

import { logger } from '../libs/_internals/logger';

import { ensureAdmin } from './_internals/ensure-admin';
import { initTasks } from './tasks';

// Functions

/**
 * There is no lock between processes: only one process may run this at a time, before the services relying on its
 * results start serving.
 */
export async function initializeSystem() {
    logger.info('Initializing system...');

    logger.info('Waiting for MongoDB connection...');
    const mongooseConnection = getDefaultMongooseConnection();
    await withTimeout(async () => await mongooseConnection.asPromise(), 10 * 1000);
    logger.success('Database connected');

    const adminId = await mongooseConnection.transaction(ensureAdmin);
    for (const task of initTasks) {
        logger.info(`Running init task ${task.name}...`);
        if (task.transaction) {
            await mongooseConnection.transaction(async (session) => {
                await task.run({
                    adminId,
                    session,
                });
            });
        } else await task.run({ adminId });
    }

    logger.success('System initialized');
}
