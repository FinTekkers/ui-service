#!/usr/bin/env bash
# US-220, cutover step 3: ui-service runs on @fintekkers/ledger-models 0.4.45
# (LM-318 + LM-320). Fails when package-lock.json resolves another version, or
# when non-generated code still uses the old wire form (the type string, a
# string version, the decimal string) or sets object_type / version by hand
# instead of through the library's stampOwn.
#
# Usage: ledger-models-cutover.sh [ROOT]   (ROOT defaults to the repo root)
set -euo pipefail

ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
EXPECTED="0.4.45"
SELF="$(basename "${BASH_SOURCE[0]}")"
failed=0

locked="$(node -e '
  const lock = require(process.argv[1]);
  const pkg = (lock.packages || {})["node_modules/@fintekkers/ledger-models"];
  process.stdout.write(pkg && pkg.version ? pkg.version : "");
' "$ROOT/package-lock.json" 2>/dev/null || true)"
if [ "$locked" != "$EXPECTED" ]; then
  echo "ledger-models-cutover: package-lock.json resolves @fintekkers/ledger-models to '${locked:-nothing}', not $EXPECTED"
  failed=1
fi

dirs=()
for d in src scripts tests; do
  [ -d "$ROOT/$d" ] && dirs+=("$ROOT/$d")
done

# scan LABEL GREP_FLAGS PATTERN
scan() {
  local label="$1" flags="$2" pattern="$3" hits
  [ "${#dirs[@]}" -eq 0 ] && return 0
  hits="$(grep -rnI $flags -E "$pattern" \
    --include='*.ts' --include='*.svelte' --include='*.js' \
    --include='*.cjs' --include='*.mjs' --include='*.sh' \
    --exclude-dir=node_modules --exclude-dir=.svelte-kit --exclude-dir=build \
    --exclude="$SELF" \
    "${dirs[@]}" || true)"
  if [ -n "$hits" ]; then
    echo "ledger-models-cutover: $label:"
    echo "$hits"
    failed=1
  fi
}

scan "the old type string (object_class) is gone" "-i" 'object_?class'
scan "version is a VersionProto, not a string" "" "setVersion\\(\\s*[\"'\`]"
scan "the decimal string (arbitrary_precision) is gone" "-i" 'arbitrary_?precision'
scan "set object_type and version only through stampOwn" "" '\.(setObjectType|setVersion)\('

if [ "$failed" -ne 0 ]; then
  exit 1
fi
echo "ledger-models-cutover: OK (@fintekkers/ledger-models $EXPECTED)"
