#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="${1:-full}"

cd "$ROOT_DIR"

echo "== multimodal-ai-course-platform harness init =="
echo "root: $ROOT_DIR"
echo "mode: $MODE"

case "$MODE" in
  quick|full|warmup|e2e)
    ;;
  *)
    echo "Unsupported mode: $MODE" >&2
    echo "Supported modes: quick | full | warmup | e2e" >&2
    exit 1
    ;;
esac

required_files=(
  "AGENTS.md"
  "README.md"
  "feature_list.json"
  "progress.md"
  "session-handoff.md"
)

echo
echo "== Checking required harness files =="
for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing required file: $file" >&2
    exit 1
  fi
  echo "ok  $file"
done

echo
echo "== Checking web workspace =="
if [[ ! -f "web/package.json" ]]; then
  echo "Missing web/package.json" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but not found in PATH" >&2
  exit 1
fi

if [[ ! -d "web/node_modules" ]]; then
  echo "Installing web dependencies..."
  (
    cd web
    npm install
  )
else
  if (
    cd web
    npm ls --depth=0 >/dev/null 2>&1
  ); then
    echo "Using existing web/node_modules"
  else
    echo "Refreshing web dependencies to match package-lock.json..."
    (
      cd web
      npm install
    )
  fi
fi

echo
echo "== Running web lint =="
(
  cd web
  npm run lint
)

if [[ "$MODE" != "quick" ]]; then
  echo
  echo "== Running web component tests =="
  (
    cd web
    npm run test
  )

  echo
  echo "== Running web build =="
  (
    cd web
    npm run build
  )
else
  echo
  echo "Skipping web build in quick mode"
fi

echo
echo "== Backend status =="
if [[ -f "backend/pyproject.toml" || -f "backend/requirements.txt" ]]; then
  if ! command -v uv >/dev/null 2>&1; then
    echo "uv is required for backend verification but not found in PATH" >&2
    exit 1
  fi

  echo "Syncing backend dependencies with uv..."
  (
    cd backend
    uv sync
  )

  echo
  echo "== Verifying generated API contract artifacts =="
  (
    cd backend
    uv run python scripts/sync_api_contracts.py --check
  )

  echo
  echo "== Running backend tests =="
  (
    cd backend
    uv run pytest
  )
else
  echo "Backend verification skipped: backend scaffold not created yet."
fi

if [[ "$MODE" == "warmup" || "$MODE" == "e2e" ]]; then
  echo
  echo "== Prewarming backend runtime assets =="
  (
    cd backend
    uv run python scripts/warm_runtime_assets.py
  )
fi

if [[ "$MODE" == "e2e" ]]; then
  echo
  echo "== Running browser smoke verification =="
  ./scripts/run_e2e_smoke.sh
fi

echo
echo "Harness verification complete."
