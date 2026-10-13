import { AdminModel } from '../../../models/admin';

export async function run() {
    await AdminModel.updateMany(
        { authenticationRevision: { $exists: false } },
        { $set: { authenticationRevision: 0 } },
    );
}
