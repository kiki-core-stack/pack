import type SendmailTransport from 'nodemailer/lib/sendmail-transport';

export type SendEmailResult = SendEmailErrorResult | SendEmailSuccessResult;
export type SendEmailSuccessResult = SendmailTransport.SentMessageInfo & { success: true };

export interface SendEmailErrorResult {
    error: Error;
    success: false;
}
