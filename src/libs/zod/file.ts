import { FileModel } from '../../models/file';

import { objectId } from './object-id';

export const fileId = () => objectId().refine(async (_id) => await FileModel.exists({ _id }) !== null);
