import { EmailProviderModel } from '../../../models/email/provider';
import { SmsProviderModel } from '../../../models/sms/provider';

export async function run() {
    await EmailProviderModel.syncIndexes();
    await SmsProviderModel.syncIndexes();
}
