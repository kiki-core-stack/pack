import type { SmsProviderCode } from '../constants/sms';
import type { smsProviderConfigVariants } from '../schemas/sms';

import type {
    DiscriminatedFieldVariant,
    ZodSchemaMapInput,
    ZodSchemaMapOutput,
} from './';

export type SmsProviderConfigByCode = ZodSchemaMapOutput<typeof smsProviderConfigVariants['schemas']>;
export type SmsProviderConfigInputByCode = ZodSchemaMapInput<typeof smsProviderConfigVariants['schemas']>;
export type SmsProviderConfigVariant<C extends SmsProviderCode = SmsProviderCode> = DiscriminatedFieldVariant<
    'code',
    'config',
    SmsProviderConfigByCode,
    C
>;
