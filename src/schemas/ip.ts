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
        z.i18nIssue({
            'en': 'Enter a valid IP address or CIDR',
            'zh-TW': '請輸入有效的 IP 或 CIDR',
        }),
    );
