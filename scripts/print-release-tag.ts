#!/usr/bin/env node

// Linux-only script.

import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

import packageJson from '../package.json' with { type: 'json' };

const repositoryPath = join(import.meta.dirname, '..');
const tag = `v${packageJson.version}`;
const commitSha = execFileSync(
    'git',
    [
        'rev-parse',
        `${tag}^{commit}`,
    ],
    {
        cwd: repositoryPath,
        encoding: 'utf8',
    },
).trim();

console.log(`Released tag: ${tag}`);
console.log(`Tag commit SHA: ${commitSha}`);
