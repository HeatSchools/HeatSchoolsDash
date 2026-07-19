#!/usr/bin/env bash
# Script para levantar el dashboard HeatSchools en modo desarrollo.
# Uso: ./scripts/run-dev.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/site"

if [ ! -d "node_modules" ]; then
  echo "→ Instalando dependencias npm…"
  npm install
fi

echo "→ Iniciando servidor de desarrollo en http://localhost:3000"
npm run dev
