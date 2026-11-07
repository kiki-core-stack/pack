import type { ClientSession } from 'mongoose';

import { AdminLogModel } from '../models/admin/log';
import { parseAdminLogMetadata } from '../schemas/admin';
import type { CreateAdminLogInput } from '../types/admin';

// Functions
export async function createAdminLog(input: CreateAdminLogInput, session?: ClientSession) {
    const [adminLog] = await AdminLogModel.create(
        [
            {
                ...input,
                metadata: await parseAdminLogMetadata(input.type, input.metadata),
            },
        ],
        { session },
    );

    return adminLog!;
}
