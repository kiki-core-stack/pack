import type { ClientSession } from 'mongoose';

import { AdminLogModel } from '../models/admin/log';
import { adminLogMetadataVariants } from '../schemas/admin';
import type { CreateAdminLogInput } from '../types/admin';

// Functions
export async function createAdminLog(input: CreateAdminLogInput, session?: ClientSession) {
    const [adminLog] = await AdminLogModel.create(
        [
            {
                ...input,
                metadata: await adminLogMetadataVariants.parse(input.type, input.metadata),
            },
        ],
        { session },
    );

    return adminLog!;
}
