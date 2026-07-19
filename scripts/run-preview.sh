#!/usr/bin/env bash
# Genera el sitio estático de producción y lo sirve localmente.
# Uso: ./scripts/run-preview.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/site"

if [ ! -d "node_modules" ]; then
  npm install
fi

echo "→ Compilando export estático…"
npm run build

echo "→ Sirviendo carpeta out/ en http://localhost:3000"
npx --yes serve out -p 3000
