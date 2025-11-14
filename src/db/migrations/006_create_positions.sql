-- Migration: 006_create_positions
-- Description: Create positions table for tracking current positions
-- Created: 2025-11-14

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
    position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL UNIQUE,
    quantity BIGINT NOT NULL CHECK (quantity >= 0),
    average_price NUMERIC(20, 2) NOT NULL CHECK (average_price >= 0),
    current_price NUMERIC(20, 2) NOT NULL CHECK (current_price >= 0),
    unrealized_pnl NUMERIC(20, 2) NOT NULL DEFAULT 0,
    realized_pnl NUMERIC(20, 2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(20, 2) NOT NULL CHECK (total_cost >= 0),
    market_value NUMERIC(20, 2) NOT NULL CHECK (market_value >= 0),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique index on symbol (one position per symbol)
CREATE UNIQUE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);

-- Create index on quantity for finding open positions
CREATE INDEX IF NOT EXISTS idx_positions_quantity ON positions(quantity) WHERE quantity > 0;

-- Create index on updated_at
CREATE INDEX IF NOT EXISTS idx_positions_updated_at ON positions(updated_at DESC);

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_positions_updated_at
    BEFORE UPDATE ON positions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE positions IS 'Current position holdings';
COMMENT ON COLUMN positions.quantity IS 'Current position size (0 = closed position)';
COMMENT ON COLUMN positions.average_price IS 'Volume-weighted average entry price';
COMMENT ON COLUMN positions.current_price IS 'Latest market price';
COMMENT ON COLUMN positions.unrealized_pnl IS 'Unrealized profit/loss on open position';
COMMENT ON COLUMN positions.realized_pnl IS 'Total realized profit/loss (from closed trades)';
COMMENT ON COLUMN positions.total_cost IS 'Total cost basis including fees';
COMMENT ON COLUMN positions.market_value IS 'Current market value of position';
