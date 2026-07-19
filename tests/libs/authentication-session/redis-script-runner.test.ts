import {
    describe,
    it,
    vi,
} from 'vitest';

import { createRedisScriptRunner } from '../../../src/libs/authentication-session/redis-store/_internals/script-runner';

describe.concurrent('redis script runner', () => {
    it('shares one script load between concurrent callers', async ({ expect }) => {
        let loaded = false;
        const send = vi.fn(async (command: string) => {
            if (command === 'SCRIPT') {
                await new Promise<void>((resolve) => void queueMicrotask(resolve));
                loaded = true;
                return 'sha';
            }

            if (!loaded) throw new Error('NOSCRIPT No matching script');
            return 1;
        });

        const execute = createRedisScriptRunner({ send }, 'return 1');

        await expect(
            Promise.all([
                execute([], []),
                execute([], []),
            ]),
        ).resolves.toEqual([
            1,
            1,
        ]);

        expect(send.mock.calls.filter(([command]) => command === 'SCRIPT')).toHaveLength(1);
    });

    it('retries one additional script reload across a failover window', async ({ expect }) => {
        const send = vi.fn()
            .mockRejectedValueOnce(new Error('NOSCRIPT first failover'))
            .mockResolvedValueOnce('sha')
            .mockRejectedValueOnce(new Error('NOSCRIPT second failover'))
            .mockResolvedValueOnce('sha')
            .mockResolvedValueOnce(1);

        const execute = createRedisScriptRunner({ send }, 'return 1');

        await expect(execute([], [])).resolves.toBe(1);
        expect(send.mock.calls.map(([command]) => command)).toEqual([
            'EVALSHA',
            'SCRIPT',
            'EVALSHA',
            'SCRIPT',
            'EVALSHA',
        ]);
    });

    it('stops retrying after two script reloads', async ({ expect }) => {
        const finalError = new Error('NOSCRIPT final failover');
        const send = vi.fn()
            .mockRejectedValueOnce(new Error('NOSCRIPT first failover'))
            .mockResolvedValueOnce('sha')
            .mockRejectedValueOnce(new Error('NOSCRIPT second failover'))
            .mockResolvedValueOnce('sha')
            .mockRejectedValueOnce(finalError);

        const execute = createRedisScriptRunner({ send }, 'return 1');

        await expect(execute([], [])).rejects.toBe(finalError);
        expect(send.mock.calls.map(([command]) => command)).toEqual([
            'EVALSHA',
            'SCRIPT',
            'EVALSHA',
            'SCRIPT',
            'EVALSHA',
        ]);
    });

    it('preserves Redis errors unrelated to missing scripts', async ({ expect }) => {
        const error = new Error('Redis unavailable');
        const execute = createRedisScriptRunner({ send: vi.fn().mockRejectedValue(error) }, 'return 1');

        await expect(execute([], [])).rejects.toBe(error);
    });
});
