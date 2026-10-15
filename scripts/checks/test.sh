#!/usr/bin/env bash
# Unit tests, run once (CI=1 stops vitest from starting watch mode).
# svelte-kit sync generates .svelte-kit/ types some tests import.
# The ledger-models cutover check (US-220) runs first. Horizon runs this
# script's text with `bash -c` from the repo root, so BASH_SOURCE is empty:
# call the check by its repo-root path.
# It logs the ledger-models version under test: install.sh refreshes it
# within package.json's range, as `python build.py --local` does (US-224).
set -euo pipefail
export CI=1
npm ls @fintekkers/ledger-models
bash scripts/checks/ledger-models-cutover.sh
npx svelte-kit sync
exec npx vitest run
