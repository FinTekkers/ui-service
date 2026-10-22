#!/usr/bin/env bash
# Prettier and ESLint, as `npm run lint`. Logs the ledger-models version
# under test first (install.sh refreshes it within range, US-224).
# Then svelte-check at error level (US-247): main already has 99 errors, so
# the check fails only when the count rises above that baseline.
set -euo pipefail
SVELTE_CHECK_MAX_ERRORS=99
npm ls @fintekkers/ledger-models
npm run lint
npx svelte-kit sync
summary="$(npx svelte-check --tsconfig ./tsconfig.json --threshold error --output machine | grep ' COMPLETED ' || true)"
echo "svelte-check: ${summary:-no summary}"
errors="$(sed -nE 's/.* ([0-9]+) ERRORS .*/\1/p' <<<"$summary")"
if [ -z "$errors" ] || [ "$errors" -gt "$SVELTE_CHECK_MAX_ERRORS" ]; then
  echo "svelte-check: ${errors:-unknown} errors, more than the $SVELTE_CHECK_MAX_ERRORS on main"
  exit 1
fi
