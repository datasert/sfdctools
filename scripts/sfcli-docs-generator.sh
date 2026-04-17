#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

cd "$ROOT"

# Ensure @xmldom/xmldom is installed
if ! node -e "require('@xmldom/xmldom')" 2>/dev/null; then
  echo "Installing required npm dependency..."
  npm install @xmldom/xmldom
fi

node "$SCRIPT_DIR/sfcli-docs-generator.mjs"
