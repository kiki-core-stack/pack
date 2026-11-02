import { totalmem } from 'node:os';

import type { Except } from 'type-fest';

// Constants
const totalMemMib = totalmem() / 1024 / 1024;
const defaultHashMemoryCost = Math.min(2 ** 18, Math.max(2 ** 16, Math.floor(totalMemMib / 32) * 1024));

// Functions
export async function hashPasswordWithArgon2(password: string, options?: Except<Bun.Password.Argon2Algorithm, 'algorithm'>) {
    return await Bun.password.hash(
        password,
        {
            algorithm: 'argon2id',
            memoryCost: options?.memoryCost ?? defaultHashMemoryCost,
            timeCost: options?.timeCost ?? 3,
        },
    );
}

export async function verifyPasswordWithArgon2(hashed: string, input: string) {
    return await Bun.password.verify(input, hashed, 'argon2id');
}
