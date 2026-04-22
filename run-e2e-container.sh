#!/usr/bin/env bash
###############################################################################
# Container-based E2E test runner for the aabenforms frontend.
#
# Builds the Nuxt frontend against the prod toolchain (node:22-alpine + pnpm),
# spins up nuxt preview inside a container, and runs the Playwright chromium
# project against it. The Playwright container joins the ddev_default network
# so it can also reach the DDEV backend and Keycloak mock.
#
# Usage:
#   ./run-e2e-container.sh            # default: landing + workflows specs
#   ./run-e2e-container.sh all        # every spec (chromium project)
#   ./run-e2e-container.sh shell      # drop into the playwright container
###############################################################################

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

COMPOSE_FILE="docker-compose.test.yml"
MODE="${1:-default}"

if ! docker network ls --format '{{.Name}}' | grep -qx 'ddev_default'; then
  echo "ddev_default network not found. Run 'ddev start' in the backend project first." >&2
  exit 1
fi

cleanup() {
  docker compose -f "$COMPOSE_FILE" down --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

case "$MODE" in
  default)
    docker compose -f "$COMPOSE_FILE" up --build --abort-on-container-exit --exit-code-from playwright
    ;;
  all)
    docker compose -f "$COMPOSE_FILE" build
    docker compose -f "$COMPOSE_FILE" run --rm playwright bash -lc 'set -e; cd /workspace; npm install --no-audit --no-fund --ignore-scripts; npx playwright install chromium; npx playwright test --project=chromium'
    ;;
  shell)
    docker compose -f "$COMPOSE_FILE" build
    docker compose -f "$COMPOSE_FILE" run --rm --entrypoint bash playwright
    ;;
  *)
    echo "usage: $0 [default|all|shell]" >&2
    exit 1
    ;;
esac
