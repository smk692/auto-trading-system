/**
 * Auto Trading System - Main Entry Point
 */

import { loadEnvConfig } from '@/config';

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  console.log('🚀 Auto Trading System Starting...');

  try {
    // Load environment configuration
    const config = loadEnvConfig();

    console.log(`📝 Environment: ${config.nodeEnv}`);
    console.log(`📝 Log Level: ${config.logLevel}`);
    console.log(`📝 Paper Trading: ${config.risk ? 'enabled' : 'disabled'}`);
    console.log(`📝 Database: ${config.postgres.host}:${config.postgres.port}`);
    console.log(`📝 Redis: ${config.redis.host}:${config.redis.port}`);

    if (config.kafka !== undefined) {
      console.log(`📝 Kafka: ${config.kafka.brokers.join(', ')}`);
    }

    console.log('\n✅ Configuration loaded successfully');
    console.log('\n⚠️  System is in setup phase - no trading functionality yet');
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };
