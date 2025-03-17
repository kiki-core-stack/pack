import '../src/hono-backend/globals/otp';

import { sendEmailOtpCode } from '../src/hono-backend/libs/otp';
import { AdminModel } from '../src/models/admin';

(async () => {
    const admin = await AdminModel.findOne({ account: '' });
    if (!admin) throw new Error('找不到管理員！');
    if (!admin.email) throw new Error('管理員沒有Email！');
    console.log(await sendEmailOtpCode('adminChangePassword', admin.email, admin.id));
    process.exit();
})();
