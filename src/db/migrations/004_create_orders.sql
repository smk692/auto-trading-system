-- Migration: 004_create_orders
-- Description: Create orders table for storing order information
-- Created: 2025-11-14

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_order_id VARCHAR(100) NOT NULL UNIQUE,
    broker_order_id VARCHAR(100),
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT')),
    quantity BIGINT NOT NULL CHECK (quantity > 0),
    price NUMERIC(20, 2) CHECK (price >= 0),
    stop_price NUMERIC(20, 2) CHECK (stop_price >= 0),
    time_in_force VARCHAR(10) NOT NULL DEFAULT 'DAY' CHECK (time_in_force IN ('DAY', 'GTC', 'IOC', 'FOK')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUBMITTED', 'ACCEPTED', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED', 'EXPIRED')),
    filled_quantity BIGINT NOT NULL DEFAULT 0 CHECK (filled_quantity >= 0),
    average_fill_price NUMERIC(20, 2) DEFAULT 0 CHECK (average_fill_price >= 0),
    correlation_id UUID NOT NULL,
    reason TEXT NOT NULL,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    filled_at TIMESTAMPTZ
);

-- Create index on client_order_id for idempotency checks
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_client_order_id ON orders(client_order_id);

-- Create index on broker_order_id
CREATE INDEX IF NOT EXISTS idx_orders_broker_order_id ON orders(broker_order_id) WHERE broker_order_id IS NOT NULL;

-- Create composite index for symbol and status
CREATE INDEX IF NOT EXISTS idx_orders_symbol_status ON orders(symbol, status);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Create index on created_at (most recent orders first)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Create index on correlation_id for tracing
CREATE INDEX IF NOT EXISTS idx_orders_correlation_id ON orders(correlation_id);

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE orders IS 'Order lifecycle tracking';
COMMENT ON COLUMN orders.client_order_id IS 'Client-generated unique order ID for idempotency';
COMMENT ON COLUMN orders.broker_order_id IS 'Broker-assigned order ID';
COMMENT ON COLUMN orders.filled_quantity IS 'Total quantity filled so far';
COMMENT ON COLUMN orders.average_fill_price IS 'Volume-weighted average fill price';
