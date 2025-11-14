-- ===================================
-- PostgreSQL Extensions Setup
-- ===================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable advanced indexing (for time-series optimization)
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Enable pg_trgm (string similarity search - useful for stock name search)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable hstore (key-value storage - useful for strategy parameters)
CREATE EXTENSION IF NOT EXISTS "hstore";

-- Enable pg_stat_statements for query performance monitoring
-- Note: Requires shared_preload_libraries='pg_stat_statements' in postgresql.conf
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
    RAISE NOTICE '✓ pg_stat_statements extension created';
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Could not create pg_stat_statements extension. This is configured in docker-compose.yml command section.';
        RAISE WARNING 'Error: %', SQLERRM;
END $$;

-- Log all installed extensions
DO $$
DECLARE
    ext RECORD;
BEGIN
    RAISE NOTICE '=== Installed PostgreSQL Extensions ===';
    FOR ext IN
        SELECT extname, extversion
        FROM pg_extension
        WHERE extname NOT IN ('plpgsql')
        ORDER BY extname
    LOOP
        RAISE NOTICE '  ✓ % (version %)', ext.extname, ext.extversion;
    END LOOP;
    RAISE NOTICE '========================================';
END $$;
