import { packLocaleCatalogs } from '../i18n/catalogs';
import * as z from '../libs/zod';

const ipAddressOrCidrUnionSchema = z.union([
    z.ipv4(),
    z.ipv6(),
    z.cidrv4(),
    z.cidrv6(),
]);

export const ipAddressOrCidrSchema = z
    .string()
    .trim()
    .refine(
        (value) => ipAddressOrCidrUnionSchema.safeParse(value).success,
        z.i18nIssue(packLocaleCatalogs, (messages) => messages.validation.ip.invalidAddressOrCidr),
    );
