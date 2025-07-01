#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
POSTGRES_HOST=${POSTGRES_HOST:-postgres}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_USER=${POSTGRES_USER:-postgres}

echo "Waiting for PostgreSQL to be ready at $POSTGRES_HOST:$POSTGRES_PORT..."
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER"; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - executing migrations"

# Run schema migration
if node build/scripts/migrate-schema.js; then
  echo "Schema migration completed."
else
  echo "Schema migration failed!" >&2
  exit 1
fi

# Run prompts migration
if node build/scripts/migrate-prompts.js; then
  echo "Prompts migration completed."
else
  echo "Prompts migration failed!" >&2
  exit 1
fi

# Verify migration
if node build/scripts/verify-improved-prompts.js; then
  echo "Migration verification completed."
else
  echo "Migration verification failed!" >&2
  exit 1
fi

# Start the MCP Prompts Server
echo "Starting MCP Prompts Server..."
exec node build/index.js 