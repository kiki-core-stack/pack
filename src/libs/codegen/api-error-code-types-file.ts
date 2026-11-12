import type { PathLike } from '@kikiutils/shared/classes/path';

import { fetchApiData } from './_internals/fetch-api-data';
import { writeGeneratedFile } from './_internals/write-generated-file';

interface GenerateApiErrorCodeTypesFileOptions {
    /**
     * Base URL of the running development backend.
     */
    apiBaseUrl: string;
    targetFilePath: PathLike;
}

/**
 * Generates the API error code file of a frontend: the code array plus its union type.
 *
 * Frontends type their error translations on it (`Record<ApiErrorCode, string>`), so an error code added in the
 * backend breaks their type check until translated.
 *
 * Needs the development-only backend route `GET /api/public/api-error-code/list`, which returns `{ codes }`.
 */
export async function generateApiErrorCodeTypesFile(options: GenerateApiErrorCodeTypesFileOptions) {
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
