import { setCustomMongooseOptions } from '@kikiutils/mongoose/options';

import { registerModelExtensions } from './_internals';

setCustomMongooseOptions('beforeModelBuild', (schema) => registerModelExtensions.forEach((fn) => fn(schema)));
