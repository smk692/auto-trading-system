#!/bin/bash

# ===================================
# Docker Infrastructure Setup Script
# ===================================

set -e

echo "🚀 Auto Trading System - Docker Setup"
echo "======================================"

# Cleanup on failure
cleanup() {
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Setup failed. Cleaning up..."
        docker-compose down 2>/dev/null || true
        echo "💡 Run the script again after fixing the issues."
    fi
}

trap cleanup EXIT

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your credentials."
    echo ""
    read -p "Press Enter to continue after updating .env file..."
fi

# Load environment variables
source .env 2>/dev/null || true

# Validate environment variables
echo "🔍 Validating .env file..."
echo ""

# Check for default passwords
if grep -q "trading_password" .env 2>/dev/null || [ "${DB_PASSWORD}" = "trading_password" ]; then
    echo "⚠️  WARNING: You are using the default DB_PASSWORD!"
    echo "   For security, it's recommended to change it in .env"
    read -p "   Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if grep -q "redis_password" .env 2>/dev/null || [ "${REDIS_PASSWORD}" = "redis_password" ]; then
    echo "⚠️  WARNING: You are using the default REDIS_PASSWORD!"
    echo "   For security, it's recommended to change it in .env"
fi

# Check required variables
required_vars=("DB_NAME" "DB_USER" "DB_PASSWORD" "REDIS_PASSWORD")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env 2>/dev/null; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ Missing required variables in .env:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    exit 1
fi

echo "✅ Environment validation passed"
echo ""

# Start infrastructure services
echo "🐳 Starting Docker containers..."
docker-compose up -d postgres redis zookeeper kafka
echo ""

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
echo ""

# Check PostgreSQL
echo "🔍 Checking PostgreSQL..."
MAX_RETRIES=30
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    if docker-compose exec -T postgres pg_isready -U "${DB_USER:-trading_user}" -d "${DB_NAME:-trading_db}" > /dev/null 2>&1; then
        # Test actual connection
        if docker-compose exec -T postgres psql -U "${DB_USER:-trading_user}" -d "${DB_NAME:-trading_db}" -c "SELECT 1;" > /dev/null 2>&1; then
            echo "✅ PostgreSQL is ready and accepting connections"
            break
        fi
    fi
    RETRY=$((RETRY+1))
    if [ $((RETRY % 5)) -eq 0 ]; then
        echo "   Waiting for PostgreSQL... ($RETRY/$MAX_RETRIES)"
    fi
    sleep 2
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo "❌ PostgreSQL failed to start within timeout"
    echo "💡 Check logs with: docker-compose logs postgres"
    exit 1
fi
echo ""

# Check Redis
echo "🔍 Checking Redis..."
MAX_RETRIES=30
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    if docker-compose exec -T redis redis-cli -a "${REDIS_PASSWORD:-redis_password}" ping 2>/dev/null | grep -q "PONG"; then
        echo "✅ Redis is ready and accepting connections"
        break
    fi
    RETRY=$((RETRY+1))
    if [ $((RETRY % 5)) -eq 0 ]; then
        echo "   Waiting for Redis... ($RETRY/$MAX_RETRIES)"
    fi
    sleep 2
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo "❌ Redis failed to start within timeout"
    echo "💡 Check logs with: docker-compose logs redis"
    exit 1
fi
echo ""

# Check Kafka
echo "🔍 Checking Kafka..."
echo "   (Kafka can take 30-60 seconds to fully start)"
MAX_RETRIES=60
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    if docker-compose exec -T kafka kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1; then
        # Additional check: can we list topics?
        if docker-compose exec -T kafka kafka-topics --bootstrap-server localhost:9092 --list > /dev/null 2>&1; then
            echo "✅ Kafka is ready and accepting connections"
            break
        fi
    fi
    RETRY=$((RETRY+1))
    if [ $((RETRY % 10)) -eq 0 ]; then
        echo "   Waiting for Kafka... ($RETRY/$MAX_RETRIES seconds)"
    fi
    sleep 1
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo "❌ Kafka failed to start within timeout"
    echo "💡 Kafka can sometimes take longer. Check logs with:"
    echo "   docker-compose logs kafka"
    exit 1
fi
echo ""

echo "========================================="
echo "✅ Infrastructure setup complete!"
echo ""
echo "Services running:"
echo "  - PostgreSQL: localhost:${DB_PORT:-5432}"
echo "  - Redis: localhost:${REDIS_PORT:-6379}"
echo "  - Kafka: localhost:${KAFKA_PORT:-9092}"
echo "  - Zookeeper: localhost:2181"
echo ""
echo "Data is stored in Docker named volumes:"
echo "  - postgres_data"
echo "  - redis_data"
echo "  - kafka_data"
echo "  - zookeeper_data, zookeeper_log"
echo ""
echo "To start development tools (pgAdmin, Kafka UI, Redis Commander):"
echo "  docker-compose --profile dev up -d"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f [service_name]"
echo ""
echo "To stop all services:"
echo "  docker-compose down"
echo ""
echo "To remove all data (⚠️  WARNING: deletes all data):"
echo "  docker-compose down -v"
echo "========================================="
