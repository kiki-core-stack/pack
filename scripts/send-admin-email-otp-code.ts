import { AdminModel } from '../src/models/admin';
import { sendEmailOtpCode } from '../src/hono-backend/utils/two-factor-authentication';

(async () => {
	const admin = await AdminModel.findByAccount('');
	if (!admin) throw new Error('找不到管理員！');
	console.log(await sendEmailOtpCode(admin));
	process.exit();
})();
