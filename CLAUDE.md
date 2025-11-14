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

# Run database migrations
pnpm run migrate

# Build
pnpm run build

# Run tests
pnpm test

# Start in development mode (paper trading)
pnpm run dev --paper-trading
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
