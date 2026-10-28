#!/usr/bin/env bash
# Browser e2e: the sidebar-links-after-login journey (US-203), against a
# production build this script starts and the broker already running on the
# host. (vite dev can't load @grpc/grpc-js in SSR here, so build like prod.)
# Fails if the journey is skipped or not run, not only if it fails.
#
# Every run logs each test's result. Screen capture, diff and approval are
# not done here (US-262): Horizon's shared runner captures the screens
# listed in .horizon/screenshots.json into the gitignored .horizon/screenshots/.
# Horizon's run_checks() runs it as the `screenshots` slot, so its capture is
# in that slot's log, not this script's.
#
# It also runs the prices page and the sibling data pages' suites (US-209),
# and the US-209 AAPL journey must pass. e2e-report.mjs judges each run.
#
# US-283: the specs for the area this branch changed run first, and the
# check stops if they fail; the rest run only after they pass.
#
# First (US-224) it logs the ledger-models version under test (install.sh
# refreshes it within package.json's range) and runs build-local.sh, the
# box's `python build.py --local` build, end to end in a fresh clone.
# Since US-281 build-local.sh runs only when build inputs or the ledger-models
# version change against origin/main, and always when the base is unknown.
#
# The e2e user's session (US-233) is FT_E2E_API_KEY, provisioned by BS-31
# and passed in by Horizon (HZ-494), set as the ft_api_key cookie with
# ft_user_email from FT_E2E_EMAIL. No test logs in: a login rotates the key
# and breaks any other run using it. A missing variable fails the check.
set -euo pipefail
missing=0
for var in FT_E2E_EMAIL FT_E2E_API_KEY; do
  if [ -z "${!var:-}" ]; then
    echo "e2e: $var is not set (Horizon provides it, HZ-494; e2e API key missing or expired? re-run BS-31's provisioning)" >&2
    missing=1
  fi
done
[ "$missing" = 0 ] || exit 1
npm ls @fintekkers/ledger-models
# US-281: build-local.sh only when a build input changed against origin/main
# or install.sh resolved a ledger-models version other than main's lock. Any
# read that fails (no origin/main, no lock, no install) runs it, as before.
run_build_local=1
base="$(git merge-base origin/main HEAD 2>/dev/null || true)"
if [ -z "$base" ]; then
  echo "e2e: build-local runs (base branch unknown)"
elif ! changed="$(git diff --name-only "$base" HEAD 2>/dev/null)"; then
  echo "e2e: build-local runs (git diff against origin/main failed)"
elif grep -Eq '^(build\.py|scripts/checks/(build-local\.sh|test_build_py\.py)|package(-lock)?\.json|(vite|svelte)\.config\..*)$' <<<"$changed"; then
  echo "e2e: build-local runs (build inputs changed)"
else
  installed="$(node -p 'JSON.parse(require("fs").readFileSync("node_modules/@fintekkers/ledger-models/package.json", "utf8")).version' 2>/dev/null || true)"
  locked="$(git show origin/main:package-lock.json 2>/dev/null | node -e '
    let s = "";
    process.stdin.on("data", (d) => (s += d)).on("end", () => {
      console.log(JSON.parse(s).packages["node_modules/@fintekkers/ledger-models"].version);
    });
  ' 2>/dev/null || true)"
  if [ -z "$installed" ] || [ -z "$locked" ]; then
    echo "e2e: build-local runs (ledger-models version unknown: installed '${installed}', main's lock '${locked}')"
  elif [ "$installed" != "$locked" ]; then
    echo "e2e: build-local runs (ledger-models $installed differs from main's lock $locked)"
  else
    run_build_local=0
  fi
fi
if [ "$run_build_local" = 1 ]; then
  bash scripts/checks/build-local.sh
else
  echo "e2e: build-local skipped (no build inputs changed)"
fi

PORT="${E2E_PORT:-4203}"
BASE_URL="http://127.0.0.1:${PORT}"
JOURNEY="sidebar-links-after-login.spec.ts"
SPECS=(
  "tests/e2e/$JOURNEY"
  tests/e2e/securities-filters-ledger-models.spec.ts
)
# US-209: the prices page and the sibling data pages' suites. They use the
# config's storageState, which this script writes (no grpcurl setup project).
# Data-dependent tests may skip. Every spec must be in the report, and no test
# may fail unless it is listed in KNOWN_FAILING below.
# US-225: the securities specs are listed by name, not by a securities-*
# glob, because securities-filters-ledger-models.spec.ts already runs in
# SPECS above and the glob ran it twice. Add any new securities-*.spec.ts
# here by name, or it will not run.
REGRESSION_SPECS=(
  tests/e2e/prices.spec.ts
  tests/e2e/securities-default-issuer.spec.ts
  tests/e2e/securities-product-type-leaf.spec.ts
  tests/e2e/securities-search.spec.ts
  tests/e2e/transactions-*.spec.ts
  tests/e2e/portfolio*.spec.ts
  tests/e2e/curves-*.spec.ts
  # US-212: the pages whose decimals now go through fromDecimalProto /
  # toDecimalProto: the calculators send a bytes + scale price to valuation,
  # and the CPI page reads its prices back.
  tests/e2e/calculators-numerical.spec.ts
  tests/e2e/tips-calculator-reference-cpi.spec.ts
  tests/e2e/cpi-index-page-data.spec.ts
  # US-229: Current CPI from the price service's CPI-U readings.
  tests/e2e/tips-calculator-current-cpi.spec.ts
  # US-237: the CUSIP dropdowns list securities; a TIPS pick fills Reference CPI.
  tests/e2e/calculators-cusip-dropdowns.spec.ts
  # US-243: the redesigned homepage: sections, layout and same-site links
  # logged out. US-250: the AAPL chart logged out, with FT_HOMEPAGE_API_KEY.
  tests/e2e/home-sections.spec.ts
  tests/e2e/home-links.spec.ts
  # US-251: the Free data explorer's hide rule leaves other routes' Navbar.
  tests/e2e/free-shell-scope.spec.ts
  # US-252: /free/soma logged out: its 7 sections, the MBS toggle and the
  # code cards.
  tests/e2e/free-pages.spec.ts
  # US-300: a page served on localhost loads no GA tag and calls no
  # googletagmanager.com.
  tests/e2e/no-analytics-on-localhost.spec.ts
)
# Tests that fail on the host for lack of data, logged as "known" without
# failing the check. Any other failure fails it, and so does a listed test
# that passes. US-225 emptied the list: a test whose data the host may lack
# now asks the ledger first and skips with the reason (the transactions
# specs), the ≥10k-securities floor was deleted (the host has ~3.5k), and
# the cpi_index test passes since the 14 Oct reload loaded CPI data. Prefer
# such a data-precondition skip to a new entry here.
KNOWN_FAILING=()
PHASE1_REPORT="$(mktemp -t e2e-phase1-report.XXXXXX.json)"
PHASE2_REPORT="$(mktemp -t e2e-phase2-report.XXXXXX.json)"
LOG="$(mktemp -t e2e-server.XXXXXX.log)"
# The chromium project's storageState (playwright.config.ts): a temp file
# under the gitignored /playwright/.auth/, deleted on exit.
AUTH_STATE=playwright/.auth/user.json
rm -f "$AUTH_STATE"

# Host backends (see the fintekkers-ui unit); overridable for local runs.
export BROKER_HOST="${BROKER_HOST:-127.0.0.1:8085}"
export BROKER_PROTO_PATH="${BROKER_PROTO_PATH:-/opt/fintekkers/broker-service/proto/auth.proto}"
export API_URL="${API_URL:-localhost}"
# $env/static/private imports must exist for the server to load; the spec
# doesn't use Google sign-in or the contact form.
export GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-e2e}"
export GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-e2e}"
export CONTACT_GMAIL_USER="${CONTACT_GMAIL_USER:-}"
export CONTACT_GMAIL_APP_PASSWORD="${CONTACT_GMAIL_APP_PASSWORD:-}"
# US-250: the homepage chart's server-held key. The run reuses the e2e user's
# key; home-sections.spec.ts reads it too, for its price-service probe.
export FT_HOMEPAGE_API_KEY="${FT_HOMEPAGE_API_KEY:-$FT_E2E_API_KEY}"

npx svelte-kit sync
npx playwright install chromium >/dev/null
# install.sh skips install scripts, so build better-sqlite3's native binding.
npm rebuild better-sqlite3 >/dev/null

npm run build >/dev/null
# ORIGIN: adapter-node rejects form POSTs (the login) as cross-site without it.
PORT="$PORT" HOST=127.0.0.1 ORIGIN="$BASE_URL" node build/index.js >"$LOG" 2>&1 &
SERVER_PID=$!
cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
  rm -f "$PHASE1_REPORT" "$PHASE2_REPORT" "$LOG"
  # The session written below is gitignored but not prettier-clean, and it
  # holds the API key; never leave it behind.
  rm -f "$AUTH_STATE"
}
trap cleanup EXIT

for _ in $(seq 1 60); do
  curl -sf -o /dev/null "$BASE_URL/login" && break
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    cat "$LOG"
    echo "server exited before it was ready" >&2
    exit 1
  fi
  sleep 2
done
curl -sf -o /dev/null "$BASE_URL/login" || {
  cat "$LOG"
  echo "server not ready at $BASE_URL" >&2
  exit 1
}

# The session file must never reach the published screenshots, which the
# shared runner writes to .horizon/screenshots/ (.horizon/screenshots.json).
# No stale-clear here: the runner deletes old PNGs and the old manifest there
# before each capture, and clearing it from this script could delete a fresh
# capture before Horizon publishes it.
if [ -n "$(find .horizon/screenshots \( -name user.json -o -path '*/.auth*' \) 2>/dev/null)" ]; then
  echo "e2e: FAIL session file (.auth/ or user.json) under .horizon/screenshots" >&2
  exit 1
fi

# Save the e2e user's session (no login) where the chromium project's
# storageState expects it. The key comes from the environment, never argv.
# It is written before any spec runs: the SPECS reset storageState to empty,
# so they still build their own session.
node --input-type=module -e '
  import { request } from "@playwright/test";
  import {
    STORAGE_STATE_PATH,
    e2eSessionRejection,
    e2eStorageState,
    getE2ECredentials,
  } from "./tests/e2e/fixtures/auth.ts";
  import { mkdirSync, writeFileSync } from "fs";
  import { dirname } from "path";
  const state = e2eStorageState(process.argv[1], getE2ECredentials());
  const rejection = await e2eSessionRejection({ request }, process.argv[1], state);
  if (rejection) {
    console.error(`e2e: ${rejection}`);
    process.exit(1);
  }
  mkdirSync(dirname(STORAGE_STATE_PATH), { recursive: true });
  writeFileSync(STORAGE_STATE_PATH, JSON.stringify(state), { mode: 0o600 });
' "$BASE_URL"

# US-283: the changed area's specs run first (phase 1), and a failure there
# stops the check; the rest run after (phase 2). select-tests.mjs picks them
# from the diff against origin/main and logs why. With no diff, shared code
# changed or no spec matched, every spec runs in one phase.
UNIVERSE=("${SPECS[@]}" "${REGRESSION_SPECS[@]}")
FIRST=()
REST=()
# Captured first, not read through <(...): a selector crash must not pass
# silently under set -e.
if selection="$(node scripts/checks/select-tests.mjs e2e "${UNIVERSE[@]}")"; then
  while IFS=$'\t' read -r kind value; do
    case "$kind" in
      reason) echo "$value" ;;
      first) FIRST+=("$value") ;;
      rest) REST+=("$value") ;;
    esac
  done <<<"$selection"
else
  echo "e2e: all specs, one phase: select-tests.mjs failed"
  selection=""
fi
# Phase 1 plus phase 2 must be exactly the check's specs, each once. Never
# call Playwright with no files: it would run every spec in tests/e2e/.
ALL="$(printf '%s\n' "${UNIVERSE[@]}" | sort -u)"
if [ "${#FIRST[@]}" = 0 ] ||
  [ "$(printf '%s\n' "${FIRST[@]}" "${REST[@]}" | sort)" != "$ALL" ]; then
  [ -z "${selection:-}" ] ||
    echo "e2e: all specs, one phase: the selection doesn't match the check's specs"
  mapfile -t FIRST <<<"$ALL"
  REST=()
fi

# Runs one phase's specs and judges its report (e2e-report.mjs); Playwright's
# own exit code isn't used, so KNOWN_FAILING can apply.
# --no-deps: the session is written above, so the setup project isn't needed.
run_phase() {
  local label="$1" report="$2"
  shift 2
  PLAYWRIGHT_BASE_URL="$BASE_URL" PLAYWRIGHT_JSON_OUTPUT_FILE="$report" \
    npx playwright test "$@" --project=chromium --no-deps \
    --reporter=list,json || true
  KNOWN_FAILING="$(printf '%s\n' "${KNOWN_FAILING[@]}")" \
    node scripts/checks/e2e-report.mjs "$report" --phase "$label" \
    --expect "$@" --strict "${SPECS[@]}"
}

if [ "${#REST[@]}" = 0 ]; then
  if ! run_phase "one phase" "$PHASE1_REPORT" "${FIRST[@]}"; then
    echo "e2e: one phase failed"
    exit 1
  fi
else
  if ! run_phase "phase 1" "$PHASE1_REPORT" "${FIRST[@]}"; then
    echo "e2e: phase 1 failed: ${#REST[@]} specs not run"
    exit 1
  fi
  if ! run_phase "phase 2" "$PHASE2_REPORT" "${REST[@]}"; then
    echo "e2e: phase 2 failed"
    exit 1
  fi
fi

echo "e2e: took ${SECONDS}s"
