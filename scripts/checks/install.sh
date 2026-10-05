#!/usr/bin/env bash
# Install step of the repo's checks (Horizon runs main's copy of each
# scripts/checks/*.sh; run them locally the same way). --ignore-scripts:
# node-sass's install script breaks on current Node.
set -euo pipefail
exec npm ci --ignore-scripts --no-audit --no-fund
