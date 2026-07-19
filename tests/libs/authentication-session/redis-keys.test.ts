import {
    describe,
    it,
} from 'vitest';

// eslint-disable-next-line style/max-len
import { createRedisAuthenticationSessionKeys } from '../../../src/libs/authentication-session/redis-store/_internals/keys';

describe.concurrent('redis authentication session keys', () => {
    it('always scopes keys by application and optionally by environment', ({ expect }) => {
        const applicationKeys = createRedisAuthenticationSessionKeys('admin', '');
        const stagingKeys = createRedisAuthenticationSessionKeys('admin', ' staging ');

        expect(applicationKeys.session('selector'))
            .toBe('kiki-core-stack:authenticationSession:admin:selector');

        expect(stagingKeys.epoch('admin-id'))
            .toBe('kiki-core-stack:staging:authenticationSessionEpoch:admin:admin-id');
    });
});
