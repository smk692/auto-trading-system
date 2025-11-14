-- Migration: 002_create_market_bars
-- Description: Create market_bars table for storing OHLCV data with partitioning
-- Created: 2025-11-14

-- Create market_bars table with partitioning by date range
CREATE TABLE IF NOT EXISTS market_bars (
    bar_id UUID DEFAULT gen_random_uuid(),
    ts TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    open NUMERIC(20, 2) NOT NULL CHECK (open >= 0),
    high NUMERIC(20, 2) NOT NULL CHECK (high >= 0),
    low NUMERIC(20, 2) NOT NULL CHECK (low >= 0),
    close NUMERIC(20, 2) NOT NULL CHECK (close >= 0),
    volume BIGINT NOT NULL CHECK (volume >= 0),
    source VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (bar_id, ts)
) PARTITION BY RANGE (ts);

-- Create composite index for symbol and timestamp (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_market_bars_symbol_ts ON market_bars(symbol, ts DESC);

-- Create index on timestamp for time-based queries
CREATE INDEX IF NOT EXISTS idx_market_bars_ts ON market_bars(ts DESC);

-- Create index on source
CREATE INDEX IF NOT EXISTS idx_market_bars_source ON market_bars(source);

-- Create initial partitions for recent data
-- Partition for current month
CREATE TABLE IF NOT EXISTS market_bars_2025_11 PARTITION OF market_bars
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Partition for next month
CREATE TABLE IF NOT EXISTS market_bars_2025_12 PARTITION OF market_bars
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Add comment
COMMENT ON TABLE market_bars IS 'Time-series OHLCV market data, partitioned by month';
COMMENT ON COLUMN market_bars.ts IS 'Timestamp of the bar (e.g., bar close time)';
COMMENT ON COLUMN market_bars.source IS 'Data source (e.g., KIS_REST, KIS_WEBSOCKET)';

-- Note: For production, you should create a maintenance job to:
-- 1. Create new partitions ahead of time (e.g., next month)
-- 2. Drop or archive old partitions (e.g., older than 1 year)
