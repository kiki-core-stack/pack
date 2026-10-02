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
            .toBe('kiki-core-stack:authenticationSession:session:admin:selector');

        expect(stagingKeys.epoch('admin-id'))
            .toBe('kiki-core-stack:staging:authenticationSession:epoch:admin:admin-id');

        expect(stagingKeys.index('admin-id', 'epoch-id'))
            .toBe('kiki-core-stack:staging:authenticationSession:index:admin:admin-id:epoch-id');

        expect(stagingKeys.qrCodeLogin('selector'))
            .toBe('kiki-core-stack:staging:authenticationSession:qrCodeLogin:admin:selector');

        expect(stagingKeys.session('selector'))
            .toBe('kiki-core-stack:staging:authenticationSession:session:admin:selector');
    });
});
