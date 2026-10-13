import * as z from 'zod';

export const ipAddressOrCidrSchema = z.string().trim().pipe(z.union([
    z.ipv4(),
    z.ipv6(),
    z.cidrv4(),
    z.cidrv6(),
]));
