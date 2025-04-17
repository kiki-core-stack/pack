import { buildMongooseModel } from '@kikiutils/mongoose/utils';

import { fileSchema } from './schema';
import type {
    File,
    FileModel,
} from './types';

export type * from './types';

const model = buildMongooseModel<File, FileModel>('file.files', 'File', fileSchema);
export { model as FileModel };
