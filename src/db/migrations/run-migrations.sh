#!/bin/bash

# Database Migration Runner
# Usage: ./run-migrations.sh

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Database connection parameters
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-trading_db}"
DB_USER="${DB_USER:-trading_user}"
DB_PASSWORD="${DB_PASSWORD}"

# Check if password is set
if [ -z "$DB_PASSWORD" ]; then
    echo "Error: DB_PASSWORD environment variable is not set"
    exit 1
fi

echo "Running database migrations..."
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Run each migration file in order
for migration in "$SCRIPT_DIR"/*.sql; do
    if [ -f "$migration" ]; then
        filename=$(basename "$migration")
        echo "Running migration: $filename"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration"

        if [ $? -eq 0 ]; then
            echo "✓ Migration $filename completed successfully"
        else
            echo "✗ Migration $filename failed"
            exit 1
        fi
        echo ""
    fi
done

echo "All migrations completed successfully!"
