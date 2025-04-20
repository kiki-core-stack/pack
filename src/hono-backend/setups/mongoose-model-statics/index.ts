import { setCustomMongooseOptions } from '@kikiutils/mongoose/options';

import { registerStaticFunctions } from './_internals';

setCustomMongooseOptions('beforeModelBuild', (schema) => registerStaticFunctions.forEach((fn) => fn(schema)));
