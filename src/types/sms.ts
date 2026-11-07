import type { SmsProviderCode } from '../constants/sms';
import type { smsProviderConfigSchemas } from '../schemas/sms';

import type {
    DiscriminatedFieldVariant,
    ZodSchemaMapInput,
    ZodSchemaMapOutput,
} from './';

export type SmsProviderConfigByCode = ZodSchemaMapOutput<typeof smsProviderConfigSchemas>;
export type SmsProviderConfigInputByCode = ZodSchemaMapInput<typeof smsProviderConfigSchemas>;
export type SmsProviderConfigVariant<C extends SmsProviderCode = SmsProviderCode> = DiscriminatedFieldVariant<
    'code',
    'config',
    SmsProviderConfigByCode,
    C
>;
