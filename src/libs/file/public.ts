import type { BaseFileData } from '../../types/data/file';

// Functions
export const getPublicFileKey = (file: BaseFileData) => `files/${file.hash}${file.extension ? `.${file.extension}` : ''}`;
export const getPublicFilePath = (file: BaseFileData) => `/${getPublicFileKey(file)}`;
