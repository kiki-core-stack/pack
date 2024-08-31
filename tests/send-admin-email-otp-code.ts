import { AdminModel } from '../src/models';
import { sendEmailOtpCode } from '../src/nitropack/utils/two-factor-authentication';

(async () => {
	const admin = await AdminModel.findByAccount('');
	if (!admin) throw new Error('找不到管理員！');
	console.log(await sendEmailOtpCode(admin));
	process.exit();
})();
