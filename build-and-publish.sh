#!/bin/bash

set -e

SCRIPT_DIR="$(dirname "$(realpath "${BASH_SOURCE[0]}")")"
cd "${SCRIPT_DIR}"

. ./.env

if [ -z "${NPM_CONFIG_REGISTRY}" ]; then
    echo "Error: The environment variable 'NPM_CONFIG_REGISTRY' is not set!"
    exit 1
fi

pnpm run build
npm publish --registry=${NPM_CONFIG_REGISTRY}
