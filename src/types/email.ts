import type { EmailProviderCode } from '../constants/email';
import type { emailProviderConfigSchemas } from '../schemas/email';

import type {
    DiscriminatedFieldVariant,
    ZodSchemaMapInput,
    ZodSchemaMapOutput,
} from './';

export type EmailProviderConfigByCode = ZodSchemaMapOutput<typeof emailProviderConfigSchemas>;
export type EmailProviderConfigInputByCode = ZodSchemaMapInput<typeof emailProviderConfigSchemas>;
export type EmailProviderConfigVariant<C extends EmailProviderCode = EmailProviderCode> = DiscriminatedFieldVariant<
    'code',
    'config',
    EmailProviderConfigByCode,
    C
>;
