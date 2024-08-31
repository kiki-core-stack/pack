import logger from '@kikiutils/node/consola';
import { cryptoSha3256, cryptoSha3512 } from '@kikiutils/node/crypto-hash';

import { AdminModel } from '../src/models';

(async () => {
	const admin = await AdminModel.create({
		account: 'account',
		enabled: true,
		name: 'name',
		password: cryptoSha3512('password')
	});

	logger.success(`Successfully created admin account: '${admin.account}'`);
	process.exit();
})();