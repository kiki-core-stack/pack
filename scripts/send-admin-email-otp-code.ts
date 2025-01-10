import '../src/hono-backend/globals/otp';
import { AdminModel } from '../src/models/admin';

(async () => {
    const admin = await AdminModel.findByAccount('');
    if (!admin) throw new Error('找不到管理員！');
    if (!admin.email) throw new Error('管理員沒有Email！');
    console.log(await sendEmailOTPCode(admin.email, 'adminChangePassword', admin.id));
    process.exit();
})();
