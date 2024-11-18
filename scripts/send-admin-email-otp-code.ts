import { exit } from 'node:process';

import '../src/hono-backend/globals/two-factor-authentication';
import { AdminModel } from '../src/models/admin';

(async () => {
	const admin = await AdminModel.findByAccount('');
	if (!admin) throw new Error('找不到管理員！');
	console.log(await sendEmailOTPCode(admin));
	exit();
})();
