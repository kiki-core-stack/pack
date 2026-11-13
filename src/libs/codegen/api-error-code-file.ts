import type { PathLike } from '@kikiutils/shared/classes/path';

import { fetchApiData } from './_internals/fetch-api-data';
import { writeGeneratedFile } from './_internals/write-generated-file';

interface GenerateApiErrorCodeFileOptions {
    /**
     * Base URL of the running development backend.
     */
    apiBaseUrl: string;
    targetFilePath: PathLike;
}

/**
 * Generates the API error code file of a frontend: the code array plus its union type.
 *
 * Frontends check specific failures by code (`errorCode === 'invalidCredentials'`) against it, so a renamed or removed
 * code breaks their type check.
 *
 * Needs the development-only backend route `GET /api/public/api-error-code/list`, which returns `{ codes }`.
 */
export async function generateApiErrorCodeFile(options: GenerateApiErrorCodeFileOptions) {
    const { codes } = await fetchApiData<{ codes: string[] }>(`${options.apiBaseUrl}/api/public/api-error-code/list`);
    const fileContents = [
        'export const apiErrorCodes = [',
        ...codes.toSorted().map((code) => `  '${code}',`),
        '] as const;',
        '',
        'export type ApiErrorCode = (typeof apiErrorCodes)[number];',
    ];

    await writeGeneratedFile(options.targetFilePath, fileContents);
}
