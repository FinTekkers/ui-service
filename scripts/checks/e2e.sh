#!/usr/bin/env bash
# Browser e2e: the sidebar-links-after-login journey (US-203), against a
# production build this script starts and the broker already running on the
# host. (vite dev can't load @grpc/grpc-js in SSR here, so build like prod.)
# Fails if the journey is skipped or not run, not only if it fails.
#
# Also captures the key screens into e2e/__screenshots__/ (US-205), which
# Horizon publishes on the PR. Every run logs each test's result and a
# screenshots PASS/INCOMPLETE verdict, then runs key-screens-files.spec.ts,
# whose assertions fail the check unless all 18 named PNGs are valid.
set -euo pipefail

PORT="${E2E_PORT:-4203}"
BASE_URL="http://127.0.0.1:${PORT}"
JOURNEY="sidebar-links-after-login.spec.ts"
SPECS=(
  "tests/e2e/$JOURNEY"
  tests/e2e/key-screens.spec.ts
  tests/e2e/capture-screenshot.spec.ts
  tests/e2e/securities-filters-ledger-models.spec.ts
)
# US-209: the prices page and the sibling data pages' suites. They use the
# config's storageState, which this script writes (no grpcurl setup project).
# Data-dependent tests may skip; none may fail, and every spec must run one.
REGRESSION_SPECS=(
  tests/e2e/prices.spec.ts
  tests/e2e/securities-*.spec.ts
  tests/e2e/transactions-*.spec.ts
  tests/e2e/portfolio*.spec.ts
  tests/e2e/curves-*.spec.ts
)
REPORT="$(mktemp -t e2e-report.XXXXXX.json)"
FILES_REPORT="$(mktemp -t e2e-files-report.XXXXXX.json)"
REGRESSION_REPORT="$(mktemp -t e2e-regression-report.XXXXXX.json)"
LOG="$(mktemp -t e2e-server.XXXXXX.log)"

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
  rm -f "$REPORT" "$FILES_REPORT" "$REGRESSION_REPORT" "$LOG"
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

# Stale PNGs from an earlier run must never reach the published set.
rm -rf e2e/__screenshots__

# --no-deps: the specs log in themselves, so the grpcurl-based setup project
# isn't needed.
PLAYWRIGHT_BASE_URL="$BASE_URL" PLAYWRIGHT_JSON_OUTPUT_FILE="$REPORT" \
  npx playwright test "${SPECS[@]}" --project=chromium --no-deps --reporter=list,json

# The journey's test must have run and passed, whatever the other specs did.
node -e '
  const report = require(process.argv[1]);
  const s = report.stats;
  console.log(`e2e: ${s.expected} passed, ${s.skipped} skipped, ${s.unexpected} failed, ${s.flaky} flaky`);
  const specs = [];
  const walk = (suite) => {
    specs.push(...(suite.specs ?? []));
    (suite.suites ?? []).forEach(walk);
  };
  report.suites.forEach(walk);
  // One line per test, so the stored check log shows every result.
  for (const spec of specs) {
    for (const t of spec.tests) console.log(`e2e:   ${t.status} ${spec.file} > ${spec.title}`);
  }
  const journey = specs
    .filter((spec) => spec.file.endsWith(process.argv[2]))
    .flatMap((spec) => spec.tests);
  const passed = journey.filter((t) => t.status === "expected").length;
  console.log(`e2e: ${process.argv[2]}: ${passed}/${journey.length} passed`);
  if (journey.length < 1 || passed < journey.length) process.exit(1);
  if (s.skipped > 0 || s.unexpected > 0) process.exit(1);
' "$REPORT" "$JOURNEY"

# Always verify strictly so every run's log records a pass/fail verdict for
# the 18 key screens; only E2E_SCREENSHOTS_STRICT=1 lets it fail the check.
if node scripts/checks/verify-screenshots.mjs --strict; then
  echo "e2e: screenshots: PASS (all key screens captured)"
elif [ "${E2E_SCREENSHOTS_STRICT:-}" = 1 ]; then
  echo "e2e: screenshots: FAIL (E2E_SCREENSHOTS_STRICT=1)" >&2
  echo "e2e: took ${SECONDS}s"
  exit 1
else
  echo "e2e: screenshots: INCOMPLETE (warn-only, see above)" >&2
fi

# Its own run, so it only starts once every capture above has finished. It
# must run and pass: a skip here means the env flag didn't reach it.
E2E_KEY_SCREENS_FILES=1 PLAYWRIGHT_BASE_URL="$BASE_URL" \
  PLAYWRIGHT_JSON_OUTPUT_FILE="$FILES_REPORT" \
  npx playwright test tests/e2e/key-screens-files.spec.ts --project=chromium \
  --no-deps --reporter=list,json
node -e '
  const s = require(process.argv[1]).stats;
  console.log(`e2e: key-screens-files: ${s.expected} passed, ${s.skipped} skipped, ${s.unexpected} failed`);
  if (s.expected < 1 || s.skipped > 0 || s.unexpected > 0) process.exit(1);
' "$FILES_REPORT"

# Log the test user in through the app and save the session where the
# chromium project's storageState expects it.
node --input-type=module -e '
  import { request } from "@playwright/test";
  import { STORAGE_STATE_PATH, ensureTestUserSession } from "./tests/e2e/fixtures/auth.ts";
  import { mkdirSync, writeFileSync } from "fs";
  import { dirname } from "path";
  const state = await ensureTestUserSession({ request }, process.argv[1]);
  mkdirSync(dirname(STORAGE_STATE_PATH), { recursive: true });
  writeFileSync(STORAGE_STATE_PATH, JSON.stringify(state));
' "$BASE_URL"

PLAYWRIGHT_BASE_URL="$BASE_URL" PLAYWRIGHT_JSON_OUTPUT_FILE="$REGRESSION_REPORT" \
  npx playwright test "${REGRESSION_SPECS[@]}" --project=chromium --no-deps \
  --reporter=list,json || true
node -e '
  const report = require(process.argv[1]);
  const s = report.stats;
  console.log(`e2e: regression: ${s.expected} passed, ${s.skipped} skipped, ${s.unexpected} failed, ${s.flaky} flaky`);
  const specs = [];
  const walk = (suite) => {
    specs.push(...(suite.specs ?? []));
    (suite.suites ?? []).forEach(walk);
  };
  report.suites.forEach(walk);
  const byFile = new Map();
  for (const spec of specs) {
    for (const t of spec.tests) {
      console.log(`e2e:   ${t.status} ${spec.file} > ${spec.title}`);
      const f = byFile.get(spec.file) ?? { passed: 0, failed: 0 };
      if (t.status === "expected") f.passed++;
      else if (t.status !== "skipped") f.failed++;
      byFile.set(spec.file, f);
    }
  }
  const expectedFiles = process.argv.slice(2).map((p) => p.replace(/^tests\/e2e\//, ""));
  let ok = report.errors?.length ? false : true;
  for (const file of expectedFiles) {
    const f = byFile.get(file);
    if (!f || f.passed < 1 || f.failed > 0) {
      console.log(`e2e: regression: FAIL ${file} (${f ? `${f.passed} passed, ${f.failed} failed` : "not run"})`);
      ok = false;
    }
  }
  // The US-209 AAPL journey must run and pass, never skip.
  const aapl = specs.filter((spec) => spec.file === "prices.spec.ts" && spec.title.includes("AAPL price rows"));
  if (aapl.length !== 1 || aapl[0].tests.some((t) => t.status !== "expected")) {
    console.log("e2e: regression: FAIL prices.spec.ts AAPL journey did not pass");
    ok = false;
  }
  if (!ok) process.exit(1);
' "$REGRESSION_REPORT" "${REGRESSION_SPECS[@]}"

echo "e2e: took ${SECONDS}s"
