import type SendmailTransport from 'nodemailer/lib/sendmail-transport';

export type SendEmailResult = SendEmailErrorResult | SendEmailSuccessResult;
export type SendEmailErrorResult = { error: Error; success: false };
export type SendEmailSuccessResult = SendmailTransport.SentMessageInfo & { success: true };
