#!/bin/bash

set -euo pipefail

SCRIPTS_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
cd "${SCRIPTS_DIR}"

. ./.env

pnpm run build
npm publish --registry="${NPM_CONFIG_REGISTRY}"
