import { checkAndGetEnvValue } from '@kikiutils/node/env';
import { createTransport } from 'nodemailer';

import type { SendEmailResult } from '@/types/email';

const nodemailerTransporter = createTransport({
    host: process.env.MAIL_SERVER_HOST || '127.0.0.1',
    port: Number(process.env.MAIL_SERVER_PORT) || 25,
    secure: process.env.NODEMAILER_USE_SECURE === 'true',
    tls: { rejectUnauthorized: false },
});

export async function sendEmail(
    bccRecipients: string | string[],
    subject: string,
    html: string,
    from?: string,
    to?: string,
): Promise<SendEmailResult> {
    if (!from) from = checkAndGetEnvValue('SEND_MAIL_FROM');
    try {
        const sendResult = await nodemailerTransporter.sendMail({
            bcc: [bccRecipients].flat().join(', '),
            from,
            html,
            subject,
            to: to ?? process.env.SEND_MAIL_TO,
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
