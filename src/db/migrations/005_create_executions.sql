-- Migration: 005_create_executions
-- Description: Create executions table for storing order fills
-- Created: 2025-11-14

-- Create executions table
CREATE TABLE IF NOT EXISTS executions (
    execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    execution_price NUMERIC(20, 2) NOT NULL CHECK (execution_price > 0),
    execution_quantity BIGINT NOT NULL CHECK (execution_quantity > 0),
    fee NUMERIC(20, 2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
    tax NUMERIC(20, 2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    correlation_id UUID NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on order_id for fast lookup of order fills
CREATE INDEX IF NOT EXISTS idx_executions_order_id ON executions(order_id);

-- Create index on symbol
CREATE INDEX IF NOT EXISTS idx_executions_symbol ON executions(symbol);

-- Create index on executed_at (most recent first)
CREATE INDEX IF NOT EXISTS idx_executions_executed_at ON executions(executed_at DESC);

-- Create index on correlation_id for tracing
CREATE INDEX IF NOT EXISTS idx_executions_correlation_id ON executions(correlation_id);

-- Add comments
COMMENT ON TABLE executions IS 'Order execution/fill records';
COMMENT ON COLUMN executions.execution_price IS 'Actual fill price';
COMMENT ON COLUMN executions.execution_quantity IS 'Number of shares filled';
COMMENT ON COLUMN executions.fee IS 'Trading commission/fee';
COMMENT ON COLUMN executions.tax IS 'Transaction tax (if applicable)';
