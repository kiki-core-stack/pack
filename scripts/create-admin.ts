import { logger } from '@kikiutils/shared/consola';
import { cryptoSha3512 } from '@kikiutils/shared/crypto-hash';

import { AdminModel } from '../src/models/admin';

(async () => {
    const admin = await AdminModel.create({
        account: 'account',
        enabled: true,
        password: cryptoSha3512('password'),
    });

    logger.success(`Successfully created admin account: ${admin.account}`);
    process.exit();
})();
