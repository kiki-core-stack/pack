import { generateWithNestedRandomLength } from '@kikiutils/shared/random';
import type { ClientSession } from 'mongoose';
import { nanoid } from 'nanoid';

import { logger } from '../../../libs/_logger';
import type { AdminDocument } from '../../../models/admin';
import { AdminModel } from '../../../models/admin';

export async function run(session: ClientSession): Promise<AdminDocument> {
    let admin = await AdminModel.findOne({}, undefined, { session });
    if (!admin) {
        logger.info('No admin found → creating default super admin');
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

    return admin;
}
