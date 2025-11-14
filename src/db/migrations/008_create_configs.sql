-- Migration: 008_create_configs
-- Description: Create configs table for versioned configuration management
-- Created: 2025-11-14

-- Create configs table
CREATE TABLE IF NOT EXISTS configs (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_type VARCHAR(50) NOT NULL,
    config_name VARCHAR(100) NOT NULL,
    config_data JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    hash VARCHAR(64) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL DEFAULT 'system',
    UNIQUE(config_type, config_name, version)
);

-- Create composite index on type and name
CREATE INDEX IF NOT EXISTS idx_configs_type_name ON configs(config_type, config_name);

-- Create index on active flag for finding current configs
CREATE INDEX IF NOT EXISTS idx_configs_active ON configs(active) WHERE active = TRUE;

-- Create index on version
CREATE INDEX IF NOT EXISTS idx_configs_version ON configs(version DESC);

-- Create index on created_at
CREATE INDEX IF NOT EXISTS idx_configs_created_at ON configs(created_at DESC);

-- Create index on hash for version tracking
CREATE INDEX IF NOT EXISTS idx_configs_hash ON configs(hash);

-- Add comments
COMMENT ON TABLE configs IS 'Versioned configuration storage';
COMMENT ON COLUMN configs.config_type IS 'Configuration type (e.g., strategy, risk)';
COMMENT ON COLUMN configs.config_name IS 'Configuration name (e.g., ma-cross-01)';
COMMENT ON COLUMN configs.config_data IS 'Configuration data as JSON';
COMMENT ON COLUMN configs.version IS 'Configuration version number';
COMMENT ON COLUMN configs.hash IS 'Configuration hash for change detection';
COMMENT ON COLUMN configs.active IS 'Is this the active version?';
