-- Migration: 007_create_risk_events
-- Description: Create risk_events table for audit trail of risk decisions
-- Created: 2025-11-14

-- Create risk_events table
CREATE TABLE IF NOT EXISTS risk_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rule_id VARCHAR(100) NOT NULL,
    symbol VARCHAR(20),
    decision BOOLEAN NOT NULL,
    reason TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    input_snapshot JSONB NOT NULL,
    correlation_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on timestamp (most recent events first)
CREATE INDEX IF NOT EXISTS idx_risk_events_ts ON risk_events(ts DESC);

-- Create index on rule_id
CREATE INDEX IF NOT EXISTS idx_risk_events_rule_id ON risk_events(rule_id);

-- Create index on symbol
CREATE INDEX IF NOT EXISTS idx_risk_events_symbol ON risk_events(symbol) WHERE symbol IS NOT NULL;

-- Create index on decision (for finding rejections)
CREATE INDEX IF NOT EXISTS idx_risk_events_decision ON risk_events(decision);

-- Create index on severity
CREATE INDEX IF NOT EXISTS idx_risk_events_severity ON risk_events(severity);

-- Create index on correlation_id for tracing
CREATE INDEX IF NOT EXISTS idx_risk_events_correlation_id ON risk_events(correlation_id);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_risk_events_created_at ON risk_events(created_at DESC);

-- Add comments
COMMENT ON TABLE risk_events IS 'Audit trail of risk management decisions';
COMMENT ON COLUMN risk_events.decision IS 'TRUE = approved, FALSE = rejected';
COMMENT ON COLUMN risk_events.input_snapshot IS 'Snapshot of risk context at decision time';
COMMENT ON COLUMN risk_events.severity IS 'Event severity level';
