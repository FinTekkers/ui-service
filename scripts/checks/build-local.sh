#!/usr/bin/env bash
# `python build.py --local`, as Horizon's Admin build command (HZ-442) runs it
# on the box. Runs build.py's unit tests, then checks --help documents
# --local, then builds a fresh clone of this commit with dummy env vars and
# asserts: exit 0, a `ledger-models <v>` line where <v> is the newest version
# in package.json's range, build/index.js exists, and the clone stays clean
# (lockfile, package.json and the tracked sqlite.db are left untouched).
# Horizon runs this script's text with `bash -c` from the repo root.
set -euo pipefail
PYTHON="${PYTHON:-python3}"

"$PYTHON" -m unittest discover -s scripts/checks -p 'test_build_py.py'

"$PYTHON" build.py --help | grep -q -- '--local' \
  || { echo "build.py --help does not document --local" >&2; exit 1; }

clone="$(mktemp -d)"
log="$(mktemp)"
trap 'rm -rf "$clone" "$log"' EXIT
git clone --quiet . "$clone"
cd "$clone"

range="$(node -p "require('./package.json').dependencies['@fintekkers/ledger-models']")"
expected="$(npm view "@fintekkers/ledger-models@$range" version | tail -n 1 | awk '{print $NF}' | tr -d "'")"

GOOGLE_CLIENT_ID=dummy GOOGLE_CLIENT_SECRET=dummy \
CONTACT_GMAIL_USER= CONTACT_GMAIL_APP_PASSWORD= API_URL=localhost \
  "$PYTHON" build.py --local 2>&1 | tee "$log"

grep -qx "ledger-models $expected" "$log" \
  || { echo "expected 'ledger-models $expected' in the build log" >&2; exit 1; }
test -f build/index.js || { echo "build/index.js missing" >&2; exit 1; }
dirty="$(git status --porcelain)"
test -z "$dirty" || { echo "checkout dirty after build:" >&2; echo "$dirty" >&2; exit 1; }
echo "build.py --local OK: ledger-models $expected"
