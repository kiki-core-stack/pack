import type { Buffer } from 'node:buffer';
import {
    cpus,
    totalmem,
} from 'node:os';

import type { Options } from 'argon2';
import {
    argon2id,
    hash,
    verify,
} from 'argon2';

// Constants
const defaultHashParallelism = Math.min(4, Math.max(1, Math.floor(cpus().length / 2)));
const totalMemMib = totalmem() / 1024 / 1024;
const defaultHashMemoryCost = Math.min(2 ** 18, Math.max(2 ** 16, Math.floor(totalMemMib / 32) * 1024));

// Functions
export function hashPasswordWithArgon2(
    password: string,
    {
        memoryCost = defaultHashMemoryCost,
        parallelism = defaultHashParallelism,
        timeCost = 3,
        type = argon2id,
        ...restOptions
    }: Options = {},
) {
    return hash(
        password,
        {
            memoryCost,
            parallelism,
            timeCost,
            type,
            ...restOptions,
        },
    );
}

export function verifyPasswordWithArgon2(hashed: string, input: string, options?: { secret: Buffer }) {
    return verify(hashed, input, options);
}
