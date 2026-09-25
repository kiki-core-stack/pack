import type { GetLeanResultType } from 'mongoose';

import { EmailProviderCode } from '../../constants/email';
import type {
    EmailProvider,
    EmailProviderDocument,
} from '../../models/email/provider';

import type { BaseEmailProvider } from './base';
import { EmailProviderError } from './error';
import { EmailSmtpProvider } from './smtp';

export type LeanedEmailProvider = GetLeanResultType<EmailProvider, EmailProviderDocument, 'findOne'>;

// Constants/Variables
const instances = new Map<string, BaseEmailProvider<any>>();

export async function closeEmailProviderInstances() {
    const results = await Promise.allSettled([...instances.values()].map(async (instance) => {
        await instance.close();
    }));

    instances.clear();
    const errors = results.filter((result) => result.status === 'rejected').map((result) => result.reason);
    if (errors.length) throw new AggregateError(errors, 'Email provider cleanup failed');
}

export function getOrCreateEmailProviderInstance(provider: LeanedEmailProvider) {
    let instance = instances.get(provider.cacheKey);
    if (instance) return instance;
    switch (provider.code) {
        case EmailProviderCode.Smtp:
            instance = new EmailSmtpProvider(provider);
            break;
        default: throw new EmailProviderError('Unsupported Email provider', 'not-accepted');
    }

    instances.set(provider.cacheKey, instance);
    return instance;
}
