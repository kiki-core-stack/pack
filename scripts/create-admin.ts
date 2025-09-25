import { logger } from '@kikiutils/shared/consola';

import { argon2HashPassword } from '../src/libs/password-argon2';
import { AdminModel } from '../src/models/admin';

(async () => {
    const account = 'account';
    const password = 'password';
    await AdminModel.create({
        account,
        enabled: true,
        isSuperAdmin: true,
        password: await argon2HashPassword(password),
    });

    logger.success(`Created admin account '${account}' with password '${password}'`);
    process.exit();
})();
