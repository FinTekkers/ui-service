#!/usr/bin/env bash
# US-220, cutover step 3: ui-service runs on @fintekkers/ledger-models 1.1.0
# or later (US-247: package.json declares a minimum only, any major above it).
# Fails when package-lock.json resolves a missing, non-x.y.z or below-1.1.0
# version (1.1.x skips the stray 1.0.2, LM-370), or
# when non-generated code still uses the old wire form (the type string, a
# string version, the decimal string) or sets object_type / version by hand
# instead of through the library's stampOwn.
#
# Usage: ledger-models-cutover.sh [ROOT]   (ROOT defaults to the repo root)
set -euo pipefail

ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
FLOOR="1.1.0"
SELF="$(basename "${BASH_SOURCE[0]}")"
failed=0

locked="$(node -e '
  const lock = require(process.argv[1]);
  const pkg = (lock.packages || {})["node_modules/@fintekkers/ledger-models"];
  process.stdout.write(pkg && pkg.version ? pkg.version : "");
' "$ROOT/package-lock.json" 2>/dev/null || true)"
# at_least VERSION: true when VERSION (x.y.z) is at or above FLOOR, compared
# numerically segment by segment.
at_least() {
  local v f i
  IFS=. read -r -a v <<<"$1"
  IFS=. read -r -a f <<<"$FLOOR"
  for i in 0 1 2; do
    if [ "$((10#${v[i]}))" -ne "$((10#${f[i]}))" ]; then
      [ "$((10#${v[i]}))" -gt "$((10#${f[i]}))" ]
      return
    fi
  done
  return 0
}
if ! [[ "$locked" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || ! at_least "$locked"; then
  echo "ledger-models-cutover: package-lock.json resolves @fintekkers/ledger-models to '${locked:-nothing}', not x.y.z at or above $FLOOR"
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
echo "ledger-models-cutover: OK (@fintekkers/ledger-models $locked)"
