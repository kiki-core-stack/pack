import { random } from 'lodash-es';
import {
    exportKey,
    generateKey,
    getKeyUri,
} from 'otp-io';
import { randomBytes } from 'otp-io/crypto';

export function generateTOTPSecretData(issuer: string, name: string) {
    const secretKey = generateKey(randomBytes, random(16, 20));
    const url = getKeyUri({
        issuer,
        name,
        secret: secretKey,
        type: 'totp',
    });

    return {
        secret: exportKey(secretKey),
        url,
    };
}
