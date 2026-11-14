import type { EmailProviderCode } from '../constants/email';
import type { emailProviderConfigVariants } from '../schemas/email';

import type {
    DiscriminatedFieldVariant,
    ZodSchemaMapInput,
    ZodSchemaMapOutput,
} from './';

export type EmailProviderConfigByCode = ZodSchemaMapOutput<typeof emailProviderConfigVariants['schemas']>;
export type EmailProviderConfigInputByCode = ZodSchemaMapInput<typeof emailProviderConfigVariants['schemas']>;
export type EmailProviderConfigVariant<C extends EmailProviderCode = EmailProviderCode> = DiscriminatedFieldVariant<
    'code',
    'config',
    EmailProviderConfigByCode,
    C
>;
