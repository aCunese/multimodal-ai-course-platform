#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${ROOT_DIR}/output/playwright"
BACKEND_LOG="${OUTPUT_DIR}/backend-e2e.log"
WEB_LOG="${OUTPUT_DIR}/web-e2e.log"

backend_pid=""
web_pid=""

cleanup() {
  local exit_code=$?

  if [[ -n "$web_pid" ]] && kill -0 "$web_pid" >/dev/null 2>&1; then
    kill "$web_pid" >/dev/null 2>&1 || true
    wait "$web_pid" >/dev/null 2>&1 || true
  fi

  if [[ -n "$backend_pid" ]] && kill -0 "$backend_pid" >/dev/null 2>&1; then
    kill "$backend_pid" >/dev/null 2>&1 || true
    wait "$backend_pid" >/dev/null 2>&1 || true
  fi

  exit "$exit_code"
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local max_attempts="${3:-60}"

  for ((attempt = 1; attempt <= max_attempts; attempt += 1)); do
    if curl --silent --fail "$url" >/dev/null 2>&1; then
      echo "ok  ${label}: ${url}"
      return 0
    fi
    sleep 1
  done

  echo "Timed out waiting for ${label}: ${url}" >&2
  return 1
}

find_free_port() {
  local start_port="$1"

  node "$ROOT_DIR/scripts/find_free_port.mjs" "$start_port"
}

trap cleanup EXIT INT TERM

mkdir -p "$OUTPUT_DIR"

for command_name in curl npm npx uv; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command not found: ${command_name}" >&2
    exit 1
  fi
done

BACKEND_PORT="$(find_free_port "${MULTIMODAL_BACKEND_PORT:-8001}")"
WEB_PORT="$(find_free_port "${MULTIMODAL_WEB_PORT:-5177}")"
API_BASE_URL="http://127.0.0.1:${BACKEND_PORT}/api/v1"
WEB_BASE_URL="http://127.0.0.1:${WEB_PORT}"

echo "== Preparing web dependencies =="
(
  cd "$ROOT_DIR/web"
  if ! npm ls --depth=0 >/dev/null 2>&1; then
    npm install
  fi
)

echo
echo "== Preparing backend dependencies =="
(
  cd "$ROOT_DIR/backend"
  uv sync
)

echo
echo "== Starting backend =="
echo "backend port: ${BACKEND_PORT}"
(
  cd "$ROOT_DIR/backend"
  uv run uvicorn app.main:app --host 127.0.0.1 --port "$BACKEND_PORT" >"$BACKEND_LOG" 2>&1
) &
backend_pid=$!
wait_for_url "${API_BASE_URL}/health" "backend health"

echo
echo "== Ensuring Playwright browser runtime =="
(
  cd "$ROOT_DIR/web"
  npx playwright install chromium
)

echo
echo "== Starting frontend =="
echo "web port: ${WEB_PORT}"
(
  cd "$ROOT_DIR/web"
  VITE_API_BASE_URL="$API_BASE_URL" \
  MULTIMODAL_PROXY_API_TARGET="http://127.0.0.1:${BACKEND_PORT}" \
  npm run dev -- --host 127.0.0.1 --port "$WEB_PORT" >"$WEB_LOG" 2>&1
) &
web_pid=$!
wait_for_url "${WEB_BASE_URL}" "web app"

echo
echo "== Running Playwright smoke flow =="
(
  cd "$ROOT_DIR/web"
  E2E_BASE_URL="$WEB_BASE_URL" OUTPUT_DIR="$OUTPUT_DIR" npm run e2e:smoke
)

echo
echo "Smoke verification complete."
echo "Artifacts:"
echo "  backend log: $BACKEND_LOG"
echo "  web log:     $WEB_LOG"
