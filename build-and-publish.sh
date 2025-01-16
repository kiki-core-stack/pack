#!/bin/bash

set -e
cd "$(dirname "$(readlink -f "$0")")"
. ./.env
[ -z "$NPM_CONFIG_REGISTRY" ] && echo "Error: The environment variable 'NPM_CONFIG_REGISTRY' is not set!" && exit 1
pnpm run build
npm publish --registry=$NPM_CONFIG_REGISTRY
