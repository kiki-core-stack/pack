#!/bin/bash

cd "$(dirname "$(readlink -f "$0")")"
. ./.env
export NPM_CONFIG_REGISTRY
pnpm run build && cp ./LICENSE ./package.json ./README.md ./dist && cd ./dist && npm publish
