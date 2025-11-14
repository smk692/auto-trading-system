-- ===================================
-- PostgreSQL Extensions Setup
-- ===================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable advanced indexing (for time-series optimization)
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Enable pg_stat_statements for query performance monitoring
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Log extensions
DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL extensions initialized successfully';
END $$;
