import type SendmailTransport from 'nodemailer/lib/sendmail-transport';

export type SendEmailResult = SendEmailErrorResult | SendEmailSuccessResult;
export type SendEmailSuccessResult = { success: true } & SendmailTransport.SentMessageInfo;

export interface SendEmailErrorResult {
	error: Error;
	success: false;
}
