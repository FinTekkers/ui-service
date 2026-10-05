#!/usr/bin/env bash
# Unit tests, run once (CI=1 stops vitest from starting watch mode).
# svelte-kit sync generates .svelte-kit/ types some tests import.
set -euo pipefail
export CI=1
npx svelte-kit sync
exec npx vitest run
