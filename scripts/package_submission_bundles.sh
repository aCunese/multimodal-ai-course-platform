#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/output/submission"
SOURCE_BUNDLE_NAME="源码压缩包"
CONTAINER_BUNDLE_NAME="容器化运行压缩包"

SOURCE_STAGE="$(mktemp -d)"
CONTAINER_STAGE="$(mktemp -d)"

cleanup() {
  rm -rf "$SOURCE_STAGE" "$CONTAINER_STAGE"
}

trap cleanup EXIT

mkdir -p "$OUTPUT_DIR"

rsync -a \
  --exclude ".git" \
  --exclude ".DS_Store" \
  --exclude ".playwright-cli" \
  --exclude "web/node_modules" \
  --exclude "web/dist" \
  --exclude "backend/.venv" \
  --exclude "backend/.pytest_cache" \
  --exclude "backend/var" \
  --exclude "output" \
  --exclude "data/**/*.zip" \
  "$ROOT_DIR/" \
  "$SOURCE_STAGE/$SOURCE_BUNDLE_NAME/"

mkdir -p "$CONTAINER_STAGE/$CONTAINER_BUNDLE_NAME/deploy/docker"
mkdir -p "$CONTAINER_STAGE/$CONTAINER_BUNDLE_NAME/docs/course-materials"
mkdir -p "$CONTAINER_STAGE/$CONTAINER_BUNDLE_NAME/scripts"

cp "$ROOT_DIR/docker-compose.yml" "$CONTAINER_STAGE/$CONTAINER_BUNDLE_NAME/"
cp "$ROOT_DIR/.dockerignore" "$CONTAINER_STAGE/$CONTAINER_BUNDLE_NAME/"
cp "$ROOT_DIR/README.md" "$CONTAINER_STAGE/$CONTAINER_BUNDLE_NAME/"
cp "$ROOT_DIR/scripts/package_submission_bundles.sh" "$CONTAINER_STAGE/$CONTAINER_BUNDLE_NAME/scripts/"
cp "$ROOT_DIR/docs/course-materials/container-delivery.md" "$CONTAINER_STAGE/$CONTAINER_BUNDLE_NAME/docs/course-materials/"
cp "$ROOT_DIR/deploy/docker/backend.Dockerfile" "$CONTAINER_STAGE/$CONTAINER_BUNDLE_NAME/deploy/docker/"
cp "$ROOT_DIR/deploy/docker/frontend.Dockerfile" "$CONTAINER_STAGE/$CONTAINER_BUNDLE_NAME/deploy/docker/"
cp "$ROOT_DIR/deploy/docker/nginx.conf" "$CONTAINER_STAGE/$CONTAINER_BUNDLE_NAME/deploy/docker/"

(
  cd "$SOURCE_STAGE"
  zip -qr "$OUTPUT_DIR/${SOURCE_BUNDLE_NAME}.zip" "$SOURCE_BUNDLE_NAME"
)

(
  cd "$CONTAINER_STAGE"
  zip -qr "$OUTPUT_DIR/${CONTAINER_BUNDLE_NAME}.zip" "$CONTAINER_BUNDLE_NAME"
)

echo "Created:"
echo "  $OUTPUT_DIR/${SOURCE_BUNDLE_NAME}.zip"
echo "  $OUTPUT_DIR/${CONTAINER_BUNDLE_NAME}.zip"
