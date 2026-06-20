#!/bin/bash
# Lightweight health check for XSCALE AI - does NOT perform startup operations
# Just verifies the server is responding

set -e

PORT=${SERVER_PORT:-3001}
MAX_RETRIES=${HEALTHCHECK_RETRIES:-3}
RETRY_DELAY=1

for i in $(seq 1 $MAX_RETRIES); do
  if curl -sf http://localhost:$PORT/api/health > /dev/null 2>&1; then
    exit 0
  fi

  if [ $i -lt $MAX_RETRIES ]; then
    sleep $RETRY_DELAY
  fi
done

exit 1
