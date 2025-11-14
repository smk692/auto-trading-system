# CLAUDE.md - AI Assistant Guide

## Project Overview

**Project Name**: Auto Trading System (개인용 주식 자동 매매 시스템)
**Status**: Design & Planning Phase (No implementation yet)
**Owner**: Individual Developer (smk692)
**Primary Language**: TypeScript (Node.js 20+)
**Package Manager**: pnpm
**Target**: Korean stock market automated trading via Korea Investment & Securities OpenAPI

### Vision
A data-driven quantitative automated trading system for individual investors to reduce emotional and repetitive trading decisions. Designed with a modular architecture allowing broker API swapping.

### Current State
⚠️ **IMPORTANT**: This repository is currently in the **design/planning stage**. There is NO code implementation yet, only comprehensive documentation:
- `README.md`: Comprehensive system overview with FLOW diagrams
- `PRD.md`: Detailed Product Requirements Document
- `주식_자동_매_시스템_PRD.md`: Korean version of PRD

## Technology Stack

### Runtime & Language
- **Node.js**: 20+ (LTS)
- **TypeScript**: 5+ (strict type checking)
- **Package Manager**: pnpm (lockfile required)

### Database & Storage
- **PostgreSQL**: 14+ (time-series data with partitioning)
- **Redis**: 7+ (caching, latest prices)

### Messaging & Streaming
- **Kafka**: Event streaming (at-least-once delivery, idempotent producer)
- **Schema**: Avro or Protobuf

### Testing & Quality
- **Jest**: Unit & integration tests
- **ESLint**: Code quality
- **Prettier**: Code formatting

### Infrastructure
- **Docker**: Containerization (slim base + distroless runtime)
- **Docker Compose**: Environment separation (dev/test/prod)

### Configuration
- **dotenv**: Environment variable management
- **YAML**: Strategy parameter externalization

### Monitoring
- **Winston/Pino**: Structured logging (JSON)
- **Prometheus**: Metrics collection (optional)
- **Alerts**: Slack, Email

## System Architecture

### Core Components (Planned)

```
┌─────────────────────────────────────────────────────────────┐
│                    Auto Trading System                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │    Data      │    │   Strategy   │    │     Risk     │ │
│  │  Collector   │───▶│    Engine    │───▶│   Manager    │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                                        │          │
│         ▼                                        ▼          │
│  ┌──────────────┐                      ┌──────────────┐   │
│  │ PostgreSQL   │                      │    Order     │   │
│  │   + Redis    │                      │   Manager    │   │
│  └──────────────┘                      └──────────────┘   │
│                                                │            │
│         ┌──────────────────────────────────────┘            │
│         ▼                                                   │
│  ┌──────────────┐                                          │
│  │    Kafka     │                                          │
│  │Event Streams │                                          │
│  └──────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │                                        ▲
         ▼                                        │
┌──────────────────┐                    ┌────────────────┐
│  Korea Invest.   │                    │  Monitoring &  │
│  Securities API  │                    │    Alerting    │
└──────────────────┘                    └────────────────┘
```

### Module Breakdown

1. **BrokerAdapter** (`src/broker/`)
   - Interface abstraction for broker APIs
   - Korea Investment & Securities implementation
   - Authentication & token management
   - Order/Price/Balance/Position APIs

2. **Data Collector** (`src/data/`)
   - Real-time WebSocket price feeds
   - Historical data via REST API
   - Watchlist management
   - Data normalization & validation

3. **Strategy Engine** (`src/strategy/`)
   - Technical indicator calculations
   - Strategy logic execution
   - Signal generation (BUY/SELL/HOLD)
   - Backtesting system

4. **Risk Manager** (`src/risk/`)
   - Real-time risk metrics
   - Pre/post-trade risk checks
   - Loss limit monitoring
   - Kill Switch implementation

5. **Order Manager** (`src/order/`)
   - Order creation & submission
   - Fill confirmation & tracking
   - Partial fill handling
   - Retry logic on failures

6. **Monitoring** (`src/monitoring/`)
   - Structured logging
   - Metrics collection
   - Alert dispatch (Slack/Email)
   - Trade audit trail

## Database Schema (Planned)

### Core Tables

```sql
-- Symbol metadata
symbols (symbol_id, symbol, name, market, status)

-- Market data (partitioned by date)
market_bars (bar_id, ts, symbol, open, high, low, close, volume, source)

-- Strategy signals
signals (signal_id, ts, strategy_id, symbol, direction, strength, params_hash, reason)

-- Orders
orders (order_id, client_order_id, symbol, side, qty, price, order_type, status)

-- Executions
executions (exec_id, order_id, exec_price, exec_qty, fee, tax)

-- Positions
positions (position_id, symbol, qty, avg_price, realized_pnl, unrealized_pnl)

-- Risk events
risk_events (event_id, ts, rule_id, symbol, input_snapshot, decision, message)

-- Configuration versioning
configs (config_id, config_type, config_name, config_data, version)
```

### Kafka Topics (Planned)

- `market.bar`: Market data stream (partitioned by symbol)
- `signal.out`: Strategy signals
- `order.new`: New order events
- `order.state`: Order state changes
- `execution.fill`: Fill events
- `risk.event`: Risk decision events

## Development Workflow

### Initial Setup (When Implementation Starts)

```bash
# Clone repository
git clone https://github.com/smk692/auto-trading-system.git
cd auto-trading-system

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# - Korea Investment & Securities API keys
# - Database credentials
# - Redis/Kafka connection strings

# Set up Docker infrastructure (PostgreSQL, Redis, Kafka)
chmod +x scripts/docker-setup.sh
./scripts/docker-setup.sh

# Run database migrations
pnpm run migrate

# Build
pnpm run build

# Run tests
pnpm test

# Start in development mode (paper trading)
pnpm run dev --paper-trading
```

### Docker Infrastructure Setup

This project uses Docker Compose to manage infrastructure dependencies (PostgreSQL, Redis, Kafka). All data is persisted in local volumes.

#### Infrastructure Services

**Core Services** (Always Running):
- **PostgreSQL 14**: Primary database (port 5432)
- **Redis 7**: Cache layer (port 6379)
- **Kafka**: Event streaming (port 9092)
- **Zookeeper**: Kafka coordination (port 2181)

**Development Tools** (Optional, use `--profile dev`):
- **pgAdmin**: PostgreSQL admin UI (port 5050)
- **Kafka UI**: Kafka monitoring (port 8080)
- **Redis Commander**: Redis admin UI (port 8081)

#### Quick Start

```bash
# Start core infrastructure
docker-compose up -d

# Start with development tools
docker-compose --profile dev up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v
```

#### Using the Setup Script

The `scripts/docker-setup.sh` script automates infrastructure setup:

```bash
# Make script executable
chmod +x scripts/docker-setup.sh

# Run setup
./scripts/docker-setup.sh
```

**What the script does**:
1. Checks for `.env` file (copies from `.env.example` if missing)
2. Creates data directories with proper permissions
3. Starts Docker containers
4. Waits for services to be healthy
5. Verifies each service is ready

#### Data Persistence

All data is stored in local `./data/` directory with bind mounts:

```
data/
├── postgres/        # PostgreSQL data files
├── redis/          # Redis persistence files
├── kafka/          # Kafka data files
├── zookeeper/      # Zookeeper data and logs
│   ├── data/
│   └── log/
└── pgadmin/        # pgAdmin configuration
```

**Important Notes**:
- The `data/` directory is in `.gitignore` (never commit data)
- Each service has its own volume for data isolation
- Volumes persist after `docker-compose down` (use `-v` flag to remove)

#### Service Health Checks

All services have health checks configured:

```bash
# Check service health
docker-compose ps

# Expected output:
# NAME                    STATUS
# auto-trading-postgres   Up (healthy)
# auto-trading-redis      Up (healthy)
# auto-trading-kafka      Up (healthy)
# auto-trading-zookeeper  Up
```

#### Common Docker Commands

```bash
# View running containers
docker-compose ps

# View logs for specific service
docker-compose logs -f postgres
docker-compose logs -f kafka

# Restart a service
docker-compose restart redis

# Execute command in container
docker-compose exec postgres psql -U trading_user -d trading_db
docker-compose exec redis redis-cli -a redis_password

# Check Kafka topics
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Stop specific service
docker-compose stop kafka

# Rebuild and restart services
docker-compose up -d --build
```

#### Troubleshooting Docker

**Port conflicts**:
```bash
# Check if ports are in use
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9092  # Kafka

# Change ports in .env file if needed
```

**Permission issues**:
```bash
# Fix data directory permissions
sudo chown -R $USER:$USER data/
chmod -R 755 data/
```

**Services not starting**:
```bash
# Check logs for errors
docker-compose logs postgres
docker-compose logs kafka

# Remove containers and volumes, start fresh
docker-compose down -v
rm -rf data/*
./scripts/docker-setup.sh
```

**Kafka connection issues**:
```bash
# Verify Zookeeper is running first
docker-compose ps zookeeper

# Wait longer for Kafka to start (can take 30-60 seconds)
docker-compose logs -f kafka

# Test Kafka connection
docker-compose exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092
```

### Git Branching Strategy

- `main`: Stable production-ready code
- `claude/claude-md-*`: AI assistant development branches
- Feature branches: `feature/<feature-name>`
- Bug fixes: `bugfix/<issue-number>`

### Commit Conventions

Use conventional commits format:
```
feat(#issue): Add feature description
fix(#issue): Fix bug description
docs(#issue): Update documentation
refactor(#issue): Code refactoring
test(#issue): Add or update tests
```

## Test-Driven Development (TDD)

### TDD Philosophy

This project **STRICTLY FOLLOWS TDD (Test-Driven Development)** principles. All code must be written using the Red-Green-Refactor cycle.

**⚠️ CRITICAL RULE**: Write tests BEFORE writing implementation code. No exceptions.

### TDD Cycle: Red-Green-Refactor

```
┌─────────────────────────────────────────────┐
│         TDD Development Cycle               │
├─────────────────────────────────────────────┤
│                                             │
│  1️⃣  RED: Write a Failing Test              │
│      ↓                                      │
│      • Write test for new functionality    │
│      • Test MUST fail (no implementation)  │
│      • Verify test failure is meaningful   │
│                                             │
│  2️⃣  GREEN: Make the Test Pass              │
│      ↓                                      │
│      • Write minimal code to pass test     │
│      • Don't optimize yet                  │
│      • All tests must pass                 │
│                                             │
│  3️⃣  REFACTOR: Improve the Code             │
│      ↓                                      │
│      • Clean up implementation             │
│      • Remove duplication                  │
│      • Improve design                      │
│      • All tests still pass                │
│                                             │
│  ↻ REPEAT for next feature                 │
│                                             │
└─────────────────────────────────────────────┘
```

### TDD Rules (The Three Laws)

1. **First Law**: You may not write production code until you have written a failing unit test
2. **Second Law**: You may not write more of a unit test than is sufficient to fail (compilation failures are failures)
3. **Third Law**: You may not write more production code than is sufficient to pass the currently failing test

### TDD Workflow Examples

#### Example 1: Implementing a Strategy

```typescript
// ❌ WRONG: Writing implementation first
// src/strategy/ma-cross.ts
export class MACrossStrategy {
  analyze(data: MarketData): Signal {
    // Implementation without tests
  }
}

// ✅ CORRECT: Writing test first
// tests/unit/strategy/ma-cross.test.ts
describe('MACrossStrategy', () => {
  describe('analyze', () => {
    it('should generate BUY signal when MA50 crosses above MA200', () => {
      // 1. Arrange
      const strategy = new MACrossStrategy({ short: 50, long: 200 });
      const marketData = createMockMarketData({
        ma50: 105,
        ma200: 100,
        volume: 1000000
      });

      // 2. Act
      const signal = strategy.analyze(marketData);

      // 3. Assert
      expect(signal.direction).toBe('BUY');
      expect(signal.strength).toBeGreaterThan(0.5);
      expect(signal.reason).toContain('MA50 crossed above MA200');
    });

    it('should generate SELL signal when MA50 crosses below MA200', () => {
      // Test implementation...
    });

    it('should generate HOLD signal when no crossover occurs', () => {
      // Test implementation...
    });
  });
});

// THEN implement the actual strategy to make tests pass
```

#### Example 2: Implementing Risk Rules

```typescript
// ✅ CORRECT: Test-first approach
// tests/unit/risk/daily-loss-limit.test.ts
describe('DailyLossLimitRule', () => {
  let rule: DailyLossLimitRule;
  let mockContext: RiskContext;

  beforeEach(() => {
    rule = new DailyLossLimitRule(-0.02); // -2% limit
    mockContext = createMockRiskContext();
  });

  it('should approve when daily loss is within limit', async () => {
    mockContext.getDailyPnl.mockReturnValue(-0.01); // -1%

    const decision = await rule.check(mockContext);

    expect(decision.approved).toBe(true);
  });

  it('should reject when daily loss exceeds limit', async () => {
    mockContext.getDailyPnl.mockReturnValue(-0.03); // -3%

    const decision = await rule.check(mockContext);

    expect(decision.approved).toBe(false);
    expect(decision.reason).toContain('daily loss limit exceeded');
  });

  it('should approve when in profit', async () => {
    mockContext.getDailyPnl.mockReturnValue(0.05); // +5%

    const decision = await rule.check(mockContext);

    expect(decision.approved).toBe(true);
  });
});

// THEN implement DailyLossLimitRule to satisfy tests
```

### Test Coverage Requirements

- **Minimum Coverage**: 80% overall
- **Critical Paths**: 100% coverage required for:
  - Risk management rules
  - Order execution logic
  - Position calculations
  - Authentication/authorization
  - Financial calculations

### Testing Pyramid

```
        ┌─────────────┐
        │   E2E Tests │  ← Few, slow, expensive
        │   (10-20%)  │
        ├─────────────┤
        │ Integration │  ← Some, moderate speed
        │   (30-40%)  │
        ├─────────────┤
        │ Unit Tests  │  ← Many, fast, cheap
        │   (50-60%)  │
        └─────────────┘
```

### Test Organization

```
tests/
├── unit/                          # Fast, isolated tests
│   ├── broker/
│   │   ├── kis-adapter.test.ts
│   │   └── auth.test.ts
│   ├── strategy/
│   │   ├── ma-cross.test.ts
│   │   └── indicators/
│   │       ├── ma.test.ts
│   │       └── volume.test.ts
│   ├── risk/
│   │   ├── daily-loss-limit.test.ts
│   │   ├── position-limit.test.ts
│   │   └── kill-switch.test.ts
│   └── order/
│       ├── order-manager.test.ts
│       └── position-tracker.test.ts
│
├── integration/                   # Tests with real dependencies
│   ├── database/
│   │   ├── postgres.test.ts
│   │   └── redis.test.ts
│   ├── kafka/
│   │   └── event-flow.test.ts
│   └── api/
│       └── kis-api.test.ts
│
└── e2e/                          # End-to-end scenarios
    ├── trading-flow.test.ts
    ├── risk-management.test.ts
    └── data-collection.test.ts
```

### Testing Best Practices

#### 1. Use AAA Pattern (Arrange-Act-Assert)

```typescript
it('should calculate position profit correctly', () => {
  // Arrange - Set up test data
  const position = new Position({
    symbol: 'AAPL',
    qty: 100,
    avgPrice: 150.00
  });

  // Act - Execute the behavior
  const profit = position.calculateProfit(155.00);

  // Assert - Verify the result
  expect(profit).toBe(500.00);
});
```

#### 2. Test One Thing at a Time

```typescript
// ✅ GOOD: Each test verifies one specific behavior
it('should reject order when daily loss limit exceeded', async () => {
  // Test only daily loss limit rule
});

it('should reject order when position count limit exceeded', async () => {
  // Test only position count rule
});

// ❌ BAD: Testing multiple things
it('should reject order when limits exceeded', async () => {
  // Testing multiple rules at once - hard to debug
});
```

#### 3. Use Descriptive Test Names

```typescript
// ✅ GOOD: Clear, descriptive names
it('should generate BUY signal when MA50 crosses above MA200 with high volume', () => {});
it('should calculate realized PnL correctly after partial fill', () => {});
it('should refresh access token when expired', () => {});

// ❌ BAD: Vague names
it('should work', () => {});
it('test1', () => {});
it('handles data', () => {});
```

#### 4. Mock External Dependencies

```typescript
// Mock broker API calls
jest.mock('@/broker/kis/api-client');

describe('OrderManager', () => {
  it('should submit order to broker API', async () => {
    // Arrange
    const mockApiClient = {
      sendOrder: jest.fn().mockResolvedValue({ orderId: '123' })
    };
    const orderManager = new OrderManager(mockApiClient);

    // Act
    const result = await orderManager.submitOrder({
      symbol: 'AAPL',
      side: 'BUY',
      qty: 100
    });

    // Assert
    expect(mockApiClient.sendOrder).toHaveBeenCalledWith({
      symbol: 'AAPL',
      side: 'BUY',
      qty: 100
    });
    expect(result.orderId).toBe('123');
  });
});
```

#### 5. Test Edge Cases and Error Conditions

```typescript
describe('Position', () => {
  // Happy path
  it('should calculate profit when price increases', () => {});

  // Edge cases
  it('should handle zero quantity', () => {});
  it('should handle negative price (error)', () => {});
  it('should handle partial fills', () => {});

  // Error conditions
  it('should throw error when quantity is negative', () => {
    expect(() => {
      new Position({ qty: -100 });
    }).toThrow('Quantity cannot be negative');
  });
});
```

### TDD in Practice: Step-by-Step

When implementing a new feature, follow these steps:

1. **Understand the Requirement**
   - Read PRD/user story
   - Identify acceptance criteria
   - Plan test cases

2. **Write Test Cases**
   - List all scenarios (happy path, edge cases, errors)
   - Start with simplest test case
   - Write test that fails

3. **Implement Minimum Code**
   - Write just enough code to pass the test
   - Don't worry about optimization
   - Run tests (should pass)

4. **Refactor**
   - Clean up code
   - Remove duplication
   - Improve naming
   - Run tests (should still pass)

5. **Repeat**
   - Move to next test case
   - Continue cycle until feature complete

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (TDD mode)
pnpm test:watch

# Run specific test file
pnpm test ma-cross.test.ts

# Run tests with coverage
pnpm test:coverage

# Run only unit tests
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e
```

### Continuous Integration

Every commit triggers:
1. ✅ Linting (ESLint)
2. ✅ Type checking (TypeScript)
3. ✅ All tests (unit + integration + e2e)
4. ✅ Coverage check (>80%)
5. ✅ Build verification

**Merge blockers**:
- Any test failure
- Coverage below 80%
- Linting errors
- Type errors

### TDD Benefits for This Project

1. **Financial Safety**: Bugs in trading systems = money loss. TDD prevents this.
2. **Confidence in Refactoring**: Can safely refactor with comprehensive test suite
3. **Living Documentation**: Tests document how code should behave
4. **Faster Debugging**: When tests fail, you know exactly what broke
5. **Better Design**: TDD encourages modular, testable code

### Common TDD Mistakes to Avoid

❌ **Writing tests after implementation**
- Defeats the purpose of TDD
- Tests become validation, not specification

❌ **Testing implementation details**
- Test behavior, not internal structure
- Tests should survive refactoring

❌ **Skipping refactor step**
- Leads to technical debt
- Code becomes messy over time

❌ **Writing integration tests first**
- Start with unit tests
- Integration tests are slower

❌ **Not running tests frequently**
- Run tests after every small change
- Use watch mode during development

### TDD Checklist for AI Assistants

Before implementing any feature:

- [ ] Have I written the test first?
- [ ] Does the test fail for the right reason?
- [ ] Did I write minimal code to pass the test?
- [ ] Did I refactor while keeping tests green?
- [ ] Are edge cases covered?
- [ ] Are error conditions tested?
- [ ] Is test coverage above 80%?
- [ ] Are tests fast and isolated?
- [ ] Do test names clearly describe behavior?
- [ ] Can I explain what this test proves?

## Code Structure (Planned)

```
auto-trading-system/
├── .env.example              # Environment template
├── .gitignore               # Git ignore rules
├── docker-compose.yml       # Docker orchestration
├── package.json             # Package dependencies
├── tsconfig.json            # TypeScript config
├── jest.config.js           # Jest test config
├── README.md                # User documentation
├── PRD.md                   # Product requirements
├── CLAUDE.md                # This file
│
├── src/                     # Source code
│   ├── broker/              # Broker API abstraction
│   │   ├── adapter.ts       # BrokerAdapter interface
│   │   ├── kis/             # Korea Investment & Securities
│   │   │   ├── auth.ts      # Authentication
│   │   │   ├── market.ts    # Market data API
│   │   │   ├── order.ts     # Order API
│   │   │   └── adapter.ts   # KIS adapter implementation
│   │   └── types.ts         # Shared types
│   │
│   ├── data/                # Data collection
│   │   ├── collector.ts     # Main collector
│   │   ├── websocket.ts     # WebSocket handler
│   │   ├── rest.ts          # REST API handler
│   │   ├── normalizer.ts    # Data normalization
│   │   └── validator.ts     # Data validation
│   │
│   ├── strategy/            # Trading strategies
│   │   ├── engine.ts        # Strategy engine
│   │   ├── indicators/      # Technical indicators
│   │   │   ├── ma.ts        # Moving averages
│   │   │   ├── volume.ts    # Volume indicators
│   │   │   └── index.ts
│   │   ├── strategies/      # Strategy implementations
│   │   │   ├── ma-cross.ts  # MA crossover strategy
│   │   │   └── index.ts
│   │   └── backtester.ts    # Backtesting system
│   │
│   ├── risk/                # Risk management
│   │   ├── manager.ts       # Risk manager
│   │   ├── rules/           # Risk rules
│   │   │   ├── daily-loss.ts    # Daily loss limit
│   │   │   ├── position-limit.ts # Position size limit
│   │   │   ├── concentration.ts  # Concentration limit
│   │   │   └── index.ts
│   │   ├── kill-switch.ts   # Emergency stop
│   │   └── types.ts
│   │
│   ├── order/               # Order management
│   │   ├── manager.ts       # Order manager
│   │   ├── tracker.ts       # Order tracking
│   │   ├── position.ts      # Position tracking
│   │   └── types.ts
│   │
│   ├── db/                  # Database layer
│   │   ├── postgres.ts      # PostgreSQL client
│   │   ├── redis.ts         # Redis client
│   │   ├── migrations/      # SQL migrations
│   │   └── repositories/    # Data access layer
│   │
│   ├── kafka/               # Kafka integration
│   │   ├── producer.ts      # Event producer
│   │   ├── consumer.ts      # Event consumer
│   │   ├── topics.ts        # Topic definitions
│   │   └── schemas/         # Event schemas
│   │
│   ├── monitoring/          # Monitoring & observability
│   │   ├── logger.ts        # Structured logging
│   │   ├── metrics.ts       # Metrics collection
│   │   ├── alerts/          # Alert handlers
│   │   │   ├── slack.ts
│   │   │   └── email.ts
│   │   └── reporter.ts      # Daily reports
│   │
│   ├── config/              # Configuration
│   │   ├── env.ts           # Environment config
│   │   ├── strategies.yaml  # Strategy parameters
│   │   └── risk.yaml        # Risk parameters
│   │
│   └── main.ts              # Application entry point
│
├── tests/                   # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── docs/                    # Additional documentation
    ├── api.md
    ├── architecture.md
    └── deployment.md
```

## Key Conventions for AI Assistants

### When Implementing Code

1. **Type Safety First**
   - Always use TypeScript strict mode
   - Define interfaces for all data structures
   - Avoid `any` types; use proper type definitions
   - Use discriminated unions for state machines

2. **Error Handling**
   - Use custom error classes for different error types
   - Always log errors with context (correlation ID)
   - Implement retry logic with exponential backoff
   - Never swallow errors silently

3. **Idempotency**
   - All operations should be idempotent where possible
   - Use `client_order_id` for order deduplication
   - Implement idempotent Kafka producers
   - Check for duplicate events before processing

4. **Logging Standards**
   ```typescript
   // Structured logging format
   logger.info('order_submitted', {
     correlationId: string,
     clientOrderId: string,
     symbol: string,
     side: 'BUY' | 'SELL',
     qty: number,
     price: number,
     reason: string,
     timestamp: ISO8601
   });
   ```

5. **Testing Requirements**
   - Write unit tests for all business logic
   - Mock external dependencies (APIs, DB, Kafka)
   - Test error scenarios and edge cases
   - Maintain >80% code coverage

6. **Security Practices**
   - NEVER commit API keys or secrets
   - Use environment variables for credentials
   - Validate all external inputs
   - Sanitize data before logging
   - Use parameterized queries for SQL

7. **Performance Considerations**
   - Use connection pooling for DB/Redis
   - Implement caching where appropriate
   - Batch operations when possible
   - Monitor and log latencies

8. **Code Style**
   - Use Prettier for formatting (auto-format on save)
   - Follow ESLint rules
   - Use meaningful variable names
   - Add JSDoc comments for public APIs
   - Keep functions small and focused (single responsibility)

### When Working with Brokers

1. **Authentication**
   - Implement token refresh logic
   - Handle authentication failures gracefully
   - Support both paper trading and live accounts
   - Log all authentication events

2. **Rate Limiting**
   - Respect API rate limits
   - Implement request throttling
   - Use exponential backoff on rate limit errors
   - Monitor API usage metrics

3. **Order Handling**
   - Always generate unique `client_order_id`
   - Track order state transitions
   - Handle partial fills correctly
   - Implement timeout handling
   - Log all order lifecycle events

### When Working with Data

1. **Data Validation**
   - Validate all incoming market data
   - Check for reasonable price ranges
   - Detect and filter outliers
   - Handle missing data gracefully

2. **Data Storage**
   - Use PostgreSQL partitioning for time-series data
   - Index frequently queried columns (symbol, timestamp)
   - Implement data archival strategy
   - Monitor database size and performance

3. **Data Streaming**
   - Use Kafka for event streaming
   - Implement proper error handling for Kafka
   - Use schema registry for event schemas
   - Monitor consumer lag

### When Working with Strategies

1. **Strategy Implementation**
   - Externalize all parameters (YAML/JSON)
   - Include version hash for parameter tracking
   - Log signal generation reasons
   - Support backtesting mode

2. **Indicator Calculation**
   - Use well-tested libraries when possible
   - Validate indicator inputs
   - Handle insufficient data periods
   - Cache calculation results when appropriate

### When Working with Risk

1. **Risk Rules**
   - Implement each rule as a separate class
   - Make rules configurable
   - Log all risk decisions with context
   - Support rule composition (AND/OR logic)

2. **Kill Switch**
   - Implement emergency stop mechanism
   - Cancel all pending orders on activation
   - Log activation reason prominently
   - Require manual reset after activation

### When Working with Monitoring

1. **Metrics to Track**
   - Order latency (submission to acknowledgment)
   - Order fill rate
   - Order failure rate
   - Slippage estimation
   - Current/max drawdown
   - Daily/weekly/monthly returns

2. **Alerting**
   - Define alert severity levels (INFO/WARNING/CRITICAL)
   - Implement rate limiting for alerts (avoid spam)
   - Include actionable information in alerts
   - Test alert delivery regularly

## Environment Variables

### Required Variables

```bash
# Korea Investment & Securities API
KIS_APP_KEY=your_app_key
KIS_APP_SECRET=your_app_secret
KIS_ACCOUNT_NO=your_account_number
KIS_ACCOUNT_TYPE=01  # 01: paper trading, change for live

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trading_db
DB_USER=trading_user
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka (optional for development)
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Risk Management
MAX_DAILY_LOSS_PCT=-0.02
MAX_POSITION_COUNT=5
MAX_POSITION_WEIGHT_PCT=0.20

# Alerts
SLACK_WEBHOOK_URL=your_slack_webhook
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_password

# Environment
NODE_ENV=development  # development | production
LOG_LEVEL=info       # debug | info | warn | error
```

## Common Tasks for AI Assistants

### 1. Implementing a New Strategy

```typescript
// src/strategy/strategies/my-strategy.ts
import { Strategy, Signal, MarketData } from '../types';

export class MyStrategy implements Strategy {
  readonly params: StrategyParams;

  constructor(params: StrategyParams) {
    this.params = params;
  }

  async analyze(marketData: MarketData): Promise<Signal> {
    // 1. Calculate indicators
    // 2. Apply strategy logic
    // 3. Generate signal with reason
    // 4. Return signal
  }

  getParamsHash(): string {
    // Return hash of parameters for version tracking
  }
}
```

### 2. Implementing a New Risk Rule

```typescript
// src/risk/rules/my-rule.ts
import { RiskRule, RiskContext, RiskDecision } from '../types';

export class MyRiskRule implements RiskRule {
  async check(context: RiskContext): Promise<RiskDecision> {
    // 1. Evaluate risk condition
    // 2. Return decision with reason
    return {
      approved: boolean,
      reason: string
    };
  }
}
```

### 3. Adding a New Broker Adapter

```typescript
// src/broker/my-broker/adapter.ts
import { BrokerAdapter, Order, Position, Balance, Price } from '../types';

export class MyBrokerAdapter implements BrokerAdapter {
  async getPrice(symbol: string): Promise<Price> {}
  async sendOrder(...): Promise<Order> {}
  async getBalance(): Promise<Balance> {}
  async getPositions(): Promise<Position[]> {}
}
```

### 4. Writing Tests

```typescript
// tests/unit/strategy/my-strategy.test.ts
import { MyStrategy } from '@/strategy/strategies/my-strategy';

describe('MyStrategy', () => {
  let strategy: MyStrategy;

  beforeEach(() => {
    strategy = new MyStrategy({ /* params */ });
  });

  it('should generate BUY signal when conditions met', async () => {
    const marketData = createMockMarketData();
    const signal = await strategy.analyze(marketData);

    expect(signal.direction).toBe('BUY');
    expect(signal.reason).toBeDefined();
  });

  // More test cases...
});
```

## Troubleshooting Guide

### Common Issues

1. **Authentication Failures**
   - Check API key/secret validity
   - Verify token refresh logic
   - Check account type (paper vs live)
   - Review authentication logs

2. **Order Rejections**
   - Verify account balance
   - Check position limits
   - Validate order parameters
   - Review broker-specific error codes

3. **Data Collection Issues**
   - Check WebSocket connection status
   - Verify symbol codes are correct
   - Check market hours
   - Review data validation logs

4. **Performance Issues**
   - Monitor database query performance
   - Check Kafka consumer lag
   - Review connection pool settings
   - Analyze slow logs

## Development Phases

### Phase 0: Foundation (Current - Design Stage)
- ✅ PRD documentation complete
- ✅ README with system flows complete
- ✅ CLAUDE.md for AI assistants complete
- ⏳ Project structure setup
- ⏳ Development environment setup

### Phase v0: Data Collection
- Data collector implementation
- PostgreSQL schema & migrations
- Redis caching layer
- WebSocket real-time feeds
- Historical data backfill

### Phase v1: Basic Trading
- Korea Investment & Securities adapter
- Order management system
- Fill tracking & position management
- Basic strategy implementation (MA crossover)
- Paper trading mode

### Phase v1.1: Risk & Monitoring
- Risk management system
- Kill switch implementation
- Structured logging
- Alert system (Slack/Email)
- Daily reports

### Phase v2: Advanced Features
- Strategy plugin architecture
- Backtesting system
- Web dashboard UI
- Advanced strategies
- Performance optimization

### Phase v3: Multi-Broker
- Additional broker adapters
- Advanced risk models
- Portfolio optimization
- Machine learning strategies

## Important Notes for AI Assistants

### What to ALWAYS Do

1. **Read Documentation First**
   - Review README.md for system overview
   - Check PRD.md for requirements
   - Understand the current phase
   - Review existing code structure

2. **Follow Security Best Practices**
   - Never expose API keys
   - Validate all inputs
   - Use parameterized queries
   - Log security events

3. **Maintain Code Quality**
   - Write tests for new code
   - Follow TypeScript best practices
   - Use proper error handling
   - Add meaningful comments

4. **Track Changes**
   - Use conventional commits
   - Update documentation
   - Add migration files for schema changes
   - Update CHANGELOG

### What to NEVER Do

1. **Security Violations**
   - Commit secrets or credentials
   - Skip input validation
   - Ignore authentication/authorization
   - Use eval() or dynamic code execution

2. **Data Integrity Issues**
   - Skip database transactions
   - Ignore idempotency requirements
   - Allow duplicate orders
   - Skip data validation

3. **Production Safety**
   - Deploy without testing
   - Skip paper trading validation
   - Ignore risk limits
   - Disable kill switch

4. **Code Quality**
   - Use `any` types unnecessarily
   - Skip error handling
   - Write untested code
   - Ignore linting errors

## Resources

### Documentation
- [Korea Investment & Securities API Docs](https://apiportal.koreainvestment.com/)
- [PostgreSQL Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [Kafka Documentation](https://kafka.apache.org/documentation/)

### Related Files
- `README.md`: System overview and flows
- `PRD.md`: Product requirements
- `.env.example`: Environment variable template

## Contact & Support

- **Repository**: https://github.com/smk692/auto-trading-system
- **Issues**: https://github.com/smk692/auto-trading-system/issues
- **Owner**: smk692

## Disclaimer

⚠️ **Investment Risk Warning**

This is an automated trading system that involves real financial risk. Key warnings:

1. **Financial Loss**: Automated trading can result in significant financial losses
2. **Paper Trading Required**: Always test thoroughly in paper trading mode before live trading
3. **No Guarantees**: Past performance does not guarantee future results
4. **User Responsibility**: All trading decisions and outcomes are the user's responsibility
5. **Legal Compliance**: Users must comply with all applicable financial regulations

## License

MIT License - See LICENSE file for details

---

**Last Updated**: 2025-11-14
**Document Version**: 1.0
**For**: AI Assistant Reference
