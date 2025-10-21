#!/bin/bash
# Database initialization script

set -e

echo "Initializing Profit Share Calculator Database..."

# Load environment variables if .env exists
if [ -f .env ]; then
    echo "Loading environment variables from .env"
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if database exists
DB_PATH=${DATABASE_URL#sqlite:///}
DB_PATH=${DB_PATH#./}

if [ -f "$DB_PATH" ]; then
    echo "Database already exists at $DB_PATH"
    read -p "Do you want to recreate it? This will delete all data. (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Removing existing database..."
        rm "$DB_PATH"
    else
        echo "Keeping existing database."
        exit 0
    fi
fi

# Create database directory if it doesn't exist
DB_DIR=$(dirname "$DB_PATH")
if [ ! -d "$DB_DIR" ]; then
    echo "Creating database directory: $DB_DIR"
    mkdir -p "$DB_DIR"
fi

# Run migrations to create schema
echo "Running database migrations..."
alembic upgrade head

echo "Database initialized successfully at $DB_PATH"
echo "You can now start the server with: ./scripts/start.sh"
