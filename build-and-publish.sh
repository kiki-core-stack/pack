#!/bin/bash

set -e
cd "$(dirname "$(readlink -f "$0")")"
. ./.env
pnpm run build
cp ./LICENSE ./package.json ./README.md ./dist
cd ./dist
npm publish --registry=$NPM_CONFIG_REGISTRY
