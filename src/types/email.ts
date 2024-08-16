import type SMTPTransport from 'nodemailer/lib/sendmail-transport';

export type SendEmailResult = SendEmailErrorResult | SendEmailSuccessResult;
export type SendEmailErrorResult = { error: Error; success: false };
export type SendEmailSuccessResult = SMTPTransport.SentMessageInfo & { success: true };
