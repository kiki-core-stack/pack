import type { GetLeanResultType } from 'mongoose';

import { SmsProviderCode } from '../../constants/sms';
import type {
    SmsProvider,
    SmsProviderDocument,
} from '../../models/sms/provider';

import type { BaseSmsProvider } from './base';
import { SmsProviderError } from './error';
import { SmsMitakeProvider } from './mitake';
import { SmsTwSmsProvider } from './tw-sms';

export type LeanedSmsProvider = GetLeanResultType<SmsProvider, SmsProviderDocument, 'findOne'>;

// Constants/Variables
const instances = new Map<string, BaseSmsProvider<any>>();
const providerCodeToInstanceClassMap = {
    [SmsProviderCode.Mitake]: SmsMitakeProvider,
    [SmsProviderCode.TwSms]: SmsTwSmsProvider,
} as const;

// Functions
export async function closeSmsProviderInstances() {
    const results = await Promise.allSettled([...instances.values()].map(async (instance) => {
        await instance.close();
    }));

    instances.clear();
    const errors = results.filter((result) => result.status === 'rejected').map((result) => result.reason);
    if (errors.length) throw new AggregateError(errors, 'Sms provider cleanup failed');
}

export function getOrCreateSmsProviderInstance(provider: LeanedSmsProvider) {
    let instance = instances.get(provider.cacheKey);
    if (instance) return instance;
    const instanceClass = providerCodeToInstanceClassMap[provider.code];
    if (!instanceClass) throw new SmsProviderError('Unsupported Sms provider', 'not-accepted');

    // eslint-disable-next-line new-cap
    instances.set(provider.cacheKey, instance = new instanceClass(provider));
    return instance;
}
