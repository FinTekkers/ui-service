#!/usr/bin/env bash
# Unit tests, run once (CI=1 stops vitest from starting watch mode).
# svelte-kit sync generates .svelte-kit/ types some tests import.
# The ledger-models cutover check (US-220) runs first.
set -euo pipefail
export CI=1
"$(dirname "${BASH_SOURCE[0]}")/ledger-models-cutover.sh"
npx svelte-kit sync
exec npx vitest run
