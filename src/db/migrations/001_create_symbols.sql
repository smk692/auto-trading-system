-- Migration: 001_create_symbols
-- Description: Create symbols table for storing stock symbol metadata
-- Created: 2025-11-14

-- Create symbols table
CREATE TABLE IF NOT EXISTS symbols (
    symbol_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    market VARCHAR(20) NOT NULL CHECK (market IN ('KOSPI', 'KOSDAQ', 'KONEX')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on symbol for fast lookups
CREATE INDEX IF NOT EXISTS idx_symbols_symbol ON symbols(symbol);

-- Create index on market for filtering
CREATE INDEX IF NOT EXISTS idx_symbols_market ON symbols(market);

-- Create index on status for filtering active symbols
CREATE INDEX IF NOT EXISTS idx_symbols_status ON symbols(status);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_symbols_updated_at
    BEFORE UPDATE ON symbols
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial data (major Korean stocks)
INSERT INTO symbols (symbol, name, market) VALUES
    ('005930', 'Samsung Electronics', 'KOSPI'),
    ('000660', 'SK Hynix', 'KOSPI'),
    ('035420', 'NAVER', 'KOSPI'),
    ('035720', 'Kakao', 'KOSPI'),
    ('051910', 'LG Chemical', 'KOSPI'),
    ('005380', 'Hyundai Motor', 'KOSPI'),
    ('006400', 'Samsung SDI', 'KOSPI'),
    ('068270', 'Celltrion', 'KOSPI'),
    ('207940', 'Samsung Biologics', 'KOSPI'),
    ('005490', 'POSCO Holdings', 'KOSPI')
ON CONFLICT (symbol) DO NOTHING;
