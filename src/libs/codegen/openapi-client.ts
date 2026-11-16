import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

import { Path } from '@kikiutils/shared/classes/path';
import type { PathLike } from '@kikiutils/shared/classes/path';

interface GenerateOpenApiClientOptions {
    /**
     * Extra `openapi-generator-cli generate` arguments, e.g. `['--additional-properties=supportsES6=true']`.
     */
    additionalArgs?: string[];

    /**
     * URL or file path of the OpenAPI document, e.g. the backend's development route `/docs/openapi.json`.
     */
    inputSpec: string;

    /**
     * Directory of the generated client; it is removed and regenerated.
     */
    outputDir: PathLike;
}

// Constants
const templateDirPath = new Path(import.meta.dirname, 'templates/openapi-client');

// Functions

/**
 * Generates a `typescript-axios` client from an OpenAPI document with the pack's templates, which make every API class
 * extend `OpenApiClientBase` (`ProfileApi.use()`) and type each call as an `ApiClientPromise` of the route's success
 * and documented error responses, since request failures resolve instead of rejecting.
 *
 * Needs `@openapitools/openapi-generator-cli` installed in the current project and Java; the generator version is
 * pinned by the templates' `openapitools.json`.
 */
export async function generateOpenApiClient(options: GenerateOpenApiClientOptions) {
    const outputDirPath = new Path(options.outputDir);
    const require = createRequire(new Path(process.cwd(), 'package.json').toString());
    const cliPackageJsonPath = new Path(require.resolve('@openapitools/openapi-generator-cli/package.json'));
    const { bin } = require(cliPackageJsonPath.toString()) as { bin: Record<string, string> };
    await outputDirPath.rm({
        force: true,
        recursive: true,
    });

    const args = [
        cliPackageJsonPath.parent.join(bin['openapi-generator-cli']!).toString(),
        '--openapitools',
        templateDirPath.join('openapitools.json').toString(),
        'generate',
        '-g',
        'typescript-axios',
        '-i',
        options.inputSpec,
        '-o',
        outputDirPath.toString(),
        '-t',
        templateDirPath.toString(),
        ...options.additionalArgs ?? [],
    ];

    await new Promise<void>((resolve, reject) => {
        spawn(process.execPath, args, { stdio: 'inherit' })
            .on('error', reject)
            .on('exit', (code) => code === 0 ? resolve() : reject(new Error(`openapi-generator-cli exited with ${code}`)));
    });
}
