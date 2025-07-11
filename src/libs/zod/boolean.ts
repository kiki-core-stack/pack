import * as z from 'zod';

export function coerceBooleanStrict() {
    return z.preprocess(
        (value) => {
            if (value === true || value === 'true') return true;
            if (value === false || value === 'false') return false;
            return value;
        },
        z.boolean(),
    );
}
