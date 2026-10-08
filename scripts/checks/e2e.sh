#!/usr/bin/env bash
# Browser e2e: the sidebar-links-after-login journey (US-203), against a
# production build this script starts and the broker already running on the
# host. (vite dev can't load @grpc/grpc-js in SSR here, so build like prod.)
# Fails if the spec is skipped or not run, not only if it fails.
set -euo pipefail

PORT="${E2E_PORT:-4203}"
BASE_URL="http://127.0.0.1:${PORT}"
SPEC="tests/e2e/sidebar-links-after-login.spec.ts"
REPORT="$(mktemp -t e2e-report.XXXXXX.json)"
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
  rm -f "$REPORT" "$LOG"
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

# --no-deps: the spec logs in itself, so the grpcurl-based setup project
# isn't needed.
PLAYWRIGHT_BASE_URL="$BASE_URL" PLAYWRIGHT_JSON_OUTPUT_FILE="$REPORT" \
  npx playwright test "$SPEC" --project=chromium --no-deps --reporter=list,json

node -e '
  const s = require(process.argv[1]).stats;
  console.log(`e2e: ${s.expected} passed, ${s.skipped} skipped, ${s.unexpected} failed, ${s.flaky} flaky`);
  if (s.expected < 1 || s.skipped > 0 || s.unexpected > 0) process.exit(1);
' "$REPORT"
