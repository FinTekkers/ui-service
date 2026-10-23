#!/usr/bin/env bash
# US-220, cutover step 3: ui-service runs on @fintekkers/ledger-models 1.1.0
# or later. US-267: the check reads the minimum from package.json, so raising
# it is a package.json and lockfile edit only, never an edit here.
# Fails when package.json does not declare ledger-models as '>=X.Y.Z' (no
# upper bound, caret, tilde or exact version) with X.Y.Z at or above 1.1.0
# (1.1.x skips the stray 1.0.2, LM-370), when package-lock.json resolves a
# missing, non-x.y.z or below-minimum version, or
# when non-generated code still uses the old wire form (the type string, a
# string version, the decimal string) or sets object_type / version by hand
# instead of through the library's stampOwn.
#
# Usage: ledger-models-cutover.sh [ROOT]   (ROOT defaults to the repo root)
set -euo pipefail

ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
SELF="$(basename "${BASH_SOURCE[0]}")"
failed=0

declared="$(node -e '
  const pkg = require(process.argv[1]);
  const range = (pkg.dependencies || {})["@fintekkers/ledger-models"];
  process.stdout.write(typeof range === "string" ? range : "");
' "$ROOT/package.json" 2>/dev/null || true)"
locked="$(node -e '
  const lock = require(process.argv[1]);
  const pkg = (lock.packages || {})["node_modules/@fintekkers/ledger-models"];
  process.stdout.write(pkg && pkg.version ? pkg.version : "");
' "$ROOT/package-lock.json" 2>/dev/null || true)"

# sort -V -C: true when its lines are already in version order.
min_re='^>=([0-9]+\.[0-9]+\.[0-9]+)$'
x_y_z_re='^[0-9]+\.[0-9]+\.[0-9]+$'
if ! [[ $declared =~ $min_re ]]; then
  echo "ledger-models-cutover: package.json declares @fintekkers/ledger-models as '${declared:-nothing}'; want '>=X.Y.Z' with no upper bound, caret, tilde or exact version"
  failed=1
else
  min="${BASH_REMATCH[1]}"
  # 1.1.0 is the lowest minimum allowed: 1.1.x skips the stray 1.0.2 (LM-370).
  if ! printf '1.1.0\n%s\n' "$min" | sort -V -C; then
    echo "ledger-models-cutover: package.json minimum $min is below 1.1.0 (LM-370: 1.1.x skips the stray 1.0.2)"
    failed=1
  fi
  if ! [[ $locked =~ $x_y_z_re ]] || ! printf '%s\n%s\n' "$min" "$locked" | sort -V -C; then
    echo "ledger-models-cutover: package-lock.json resolves @fintekkers/ledger-models to '${locked:-nothing}', not x.y.z at or above package.json's minimum $min"
    failed=1
  fi
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
