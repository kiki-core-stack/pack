import { Path } from '@kikiutils/shared/classes/path';
import type { PathLike } from '@kikiutils/shared/classes/path';

export async function writeGeneratedFile(targetFilePath: PathLike, lines: readonly string[]) {
    const targetPath = new Path(targetFilePath);
    await targetPath.parent.mkdir({ recursive: true });
    await targetPath.writeFile([
        '/* eslint-disable eslint-comments/no-unlimited-disable */',
        '/* eslint-disable */',
        '',
        ...lines,
        '',
    ].join('\n'));
}
