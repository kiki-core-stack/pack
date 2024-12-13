import { checkAndGetEnvValue } from '@kikiutils/node/env';
import { env } from 'node:process';
import { createTransport } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import type { SendEmailResult } from '@/types/email';

const nodemailerTransporter = createTransport({
    host: env.MAIL_SERVER_HOST || '127.0.0.1',
    port: Number(env.MAIL_SERVER_PORT) || 25,
    secure: env.NODEMAILER_USE_SECURE === 'true',
    tls: { rejectUnauthorized: false },
} as SMTPTransport.Options);

export async function sendEmail(bccRecipients: string | string[], subject: string, html: string, from?: string, to?: string): Promise<SendEmailResult> {
    if (!from) from = checkAndGetEnvValue('SEND_MAIL_FROM');
    try {
        const sendResult = await nodemailerTransporter.sendMail({
            bcc: [bccRecipients].flat().join(', '),
            from,
            html,
            subject,
            to: to ?? env.SEND_MAIL_TO,
        });

        return {
            ...sendResult,
            success: true,
        };
    } catch (error) {
        return {
            error: error as Error,
            success: false,
        };
    }
}
