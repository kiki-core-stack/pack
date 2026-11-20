import { ref } from '@kikiutils/mongoose/schema-builders';

export const admin = () => ref('Admin');
export const adminRole = () => ref('AdminRole');
export const emailProvider = () => ref('EmailProvider');
export const file = () => ref('File');
export const smsProvider = () => ref('SmsProvider');
