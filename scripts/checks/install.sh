#!/usr/bin/env bash
# Install step of the repo's checks (Horizon runs main's copy of each
# scripts/checks/*.sh; run them locally the same way). --ignore-scripts:
# node-sass's install script breaks on current Node.
# Then refresh ledger-models to the newest version in package.json's range,
# as `python build.py --local` does for the box, so what's checked is what
# deploys. Every other dependency stays on its lockfile version.
set -euo pipefail
npm ci --ignore-scripts --no-audit --no-fund
npm update @fintekkers/ledger-models --ignore-scripts --no-audit --no-fund
exec npm ls @fintekkers/ledger-models
