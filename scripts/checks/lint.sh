#!/usr/bin/env bash
# Prettier and ESLint, as `npm run lint`. Logs the ledger-models version
# under test first (install.sh refreshes it within range, US-224).
set -euo pipefail
npm ls @fintekkers/ledger-models
exec npm run lint
