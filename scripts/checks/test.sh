#!/usr/bin/env bash
# Unit tests, run to completion (CI=1 stops vitest from starting watch mode).
# svelte-kit sync generates .svelte-kit/ types some tests import.
# The ledger-models cutover check (US-220) runs first. Horizon runs this
# script's text with `bash -c` from the repo root, so BASH_SOURCE is empty:
# call the check by its repo-root path.
# It logs the ledger-models version under test: install.sh refreshes it
# within package.json's range, as `python build.py --local` does (US-224).
# US-283: the tests vitest relates to the files changed against origin/main
# run first, and a failure there stops the check before the full run.
# select-tests.mjs logs why; with no diff or a config change it's one full
# run (vitest reruns everything on a config change anyway).
set -euo pipefail
export CI=1
npm ls @fintekkers/ledger-models
bash scripts/checks/ledger-models-cutover.sh
npx svelte-kit sync
selection="$(node scripts/checks/select-tests.mjs unit)" ||
  selection="$(printf 'reason\tunit: all tests, one run: select-tests.mjs failed\nmode\tall')"
mode=all
while IFS=$'\t' read -r kind value; do
  case "$kind" in
    reason) echo "$value" ;;
    mode) mode="$value" ;;
  esac
done <<<"$selection"
if [ "$mode" = changed ]; then
  start=$SECONDS
  # --passWithNoTests: a diff no test relates to runs nothing, and passes.
  if ! npx vitest run --changed origin/main --passWithNoTests; then
    echo "unit: phase 1 failed: full vitest run not started"
    exit 1
  fi
  echo "unit: changed run took $((SECONDS - start))s"
fi
echo "unit: full run"
start=$SECONDS
status=0
npx vitest run || status=$?
echo "unit: full run took $((SECONDS - start))s"
exit "$status"
