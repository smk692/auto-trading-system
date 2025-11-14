#!/bin/bash

# ===================================
# Docker Infrastructure Setup Script
# ===================================

set -e

echo "🚀 Auto Trading System - Docker Setup"
echo "======================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your credentials."
    echo ""
    read -p "Press Enter to continue after updating .env file..."
fi

# Create data directories if they don't exist
echo "📁 Creating data directories..."
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p data/kafka
mkdir -p data/zookeeper/data
mkdir -p data/zookeeper/log
mkdir -p data/pgadmin
echo "✅ Data directories created"
echo ""

# Set proper permissions
echo "🔐 Setting permissions..."
chmod -R 755 data/
echo "✅ Permissions set"
echo ""

# Start infrastructure services
echo "🐳 Starting Docker containers..."
docker-compose up -d postgres redis zookeeper kafka
echo ""

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check PostgreSQL
echo "🔍 Checking PostgreSQL..."
docker-compose exec -T postgres pg_isready -U trading_user
echo "✅ PostgreSQL is ready"
echo ""

# Check Redis
echo "🔍 Checking Redis..."
docker-compose exec -T redis redis-cli ping
echo "✅ Redis is ready"
echo ""

# Check Kafka
echo "🔍 Checking Kafka..."
docker-compose exec -T kafka kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Kafka is ready"
else
    echo "⚠️  Kafka might still be starting. Please wait a moment and check manually."
fi
echo ""

echo "========================================="
echo "✅ Infrastructure setup complete!"
echo ""
echo "Services running:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - Kafka: localhost:9092"
echo "  - Zookeeper: localhost:2181"
echo ""
echo "To start development tools (pgAdmin, Kafka UI, Redis Commander):"
echo "  docker-compose --profile dev up -d"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f [service_name]"
echo ""
echo "To stop all services:"
echo "  docker-compose down"
echo "========================================="
