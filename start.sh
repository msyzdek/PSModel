#!/bin/bash
# Quick start script for Profit Share Calculator

set -e

echo "======================================"
echo "Profit Share Calculator - Quick Start"
echo "======================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed."
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Error: Docker Compose is not installed."
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp backend/.env.example .env
    
    echo ""
    echo "⚠️  IMPORTANT: Default credentials are being used!"
    echo ""
    echo "Please edit the .env file and change:"
    echo "  - ADMIN_PASSWORD (currently: changeme)"
    echo "  - JWT_SECRET_KEY (currently: dev-secret-key)"
    echo ""
    read -p "Press Enter to continue with defaults, or Ctrl+C to exit and edit .env first..."
fi

# Create data directory for database
mkdir -p backend/data

echo ""
echo "Starting services with Docker Compose..."
echo ""

# Use docker compose (v2) or docker-compose (v1)
if docker compose version &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi

echo ""
echo "✅ Services started successfully!"
echo ""
echo "Access the application:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Default credentials:"
echo "  Username: admin"
echo "  Password: changeme (or your custom password from .env)"
echo ""
echo "To view logs:"
if docker compose version &> /dev/null; then
    echo "  docker compose logs -f"
else
    echo "  docker-compose logs -f"
fi
echo ""
echo "To stop services:"
if docker compose version &> /dev/null; then
    echo "  docker compose down"
else
    echo "  docker-compose down"
fi
echo ""
