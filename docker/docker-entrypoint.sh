#!/bin/bash

# Check if STORAGE_DIR is set
if [ -z "$STORAGE_DIR" ]; then
    echo "================================================================"
    echo "⚠️  ⚠️  ⚠️  WARNING: STORAGE_DIR environment variable is not set! ⚠️  ⚠️  ⚠️"
    echo ""
    echo "Not setting this will result in data loss on container restart since"
    echo "the application will not have a persistent storage location."
    echo "It can also result in weird errors in various parts of the application."
    echo ""
    echo "Please run the container with the official docker command at"
    echo "https://docs.anythingllm.com/installation-docker/quickstart"
    echo ""
    echo "⚠️  ⚠️  ⚠️  WARNING: STORAGE_DIR environment variable is not set! ⚠️  ⚠️  ⚠️"
    echo "================================================================"
fi

# Prisma schema resolves to /app/server/storage regardless of STORAGE_DIR.
# When Coolify mounts a volume here, the directory may be root-owned.
# We ensure it exists and is writable (ignore errors if already correct).
mkdir -p /app/server/storage 2>/dev/null || true
chmod 775 /app/server/storage 2>/dev/null || true

{
  cd /app/server/ &&
    # Disable Prisma CLI telemetry (https://www.prisma.io/docs/orm/tools/prisma-cli#how-to-opt-out-of-data-collection)
    export CHECKPOINT_DISABLE=1 &&
    npx prisma generate --schema=./prisma/schema.prisma && \
    npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss && \
    node /app/server/index.js
} &
{ node /app/collector/index.js; } &
wait -n
exit $?
