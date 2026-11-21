import type {
    ClientSession,
    Types,
} from 'mongoose';
import { nanoid } from 'nanoid';

import { logger } from '../../libs/_internals/logger';
import { AdminModel } from '../../models/admin';

export async function ensureAdmin(session: ClientSession): Promise<Types.ObjectId> {
    const existingAdmin = await AdminModel.findOne({}, undefined, { session }).select('_id').lean();
    if (existingAdmin) return existingAdmin._id;

    logger.info('No admin found → creating default super admin');
    const password = nanoid(32);
    const admin = (await AdminModel.create(
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
    return admin._id;
}
