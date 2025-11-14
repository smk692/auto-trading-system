/**
 * Environment configuration loader
 */

import type { RiskLimits } from '@/types';

/**
 * Node environment
 */
export type NodeEnv = 'development' | 'production' | 'test';

/**
 * Log level
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Environment configuration interface
 */
export interface EnvConfig {
  // Environment
  readonly nodeEnv: NodeEnv;
  readonly logLevel: LogLevel;

  // Korea Investment & Securities API
  readonly kis: {
    readonly appKey: string;
    readonly appSecret: string;
    readonly accountNo: string;
    readonly accountType: string; // '01' for paper trading
    readonly baseUrl: string;
    readonly wsUrl: string;
  };

  // PostgreSQL
  readonly postgres: {
    readonly host: string;
    readonly port: number;
    readonly database: string;
    readonly user: string;
    readonly password: string;
    readonly maxConnections: number;
  };

  // Redis
  readonly redis: {
    readonly host: string;
    readonly port: number;
    readonly password?: string;
    readonly db: number;
  };

  // Kafka (optional)
  readonly kafka?: {
    readonly brokers: readonly string[];
    readonly clientId: string;
    readonly groupId: string;
  };

  // Risk limits
  readonly risk: RiskLimits;

  // Alerts
  readonly alerts: {
    readonly slack?: {
      readonly webhookUrl: string;
    };
    readonly email?: {
      readonly smtpHost: string;
      readonly smtpPort: number;
      readonly smtpUser: string;
      readonly smtpPassword: string;
      readonly from: string;
      readonly to: readonly string[];
    };
  };
}

/**
 * Load and validate environment configuration
 */
export function loadEnvConfig(): EnvConfig {
  // Load from process.env
  const nodeEnv = (process.env['NODE_ENV'] || 'development') as NodeEnv;
  const logLevel = (process.env['LOG_LEVEL'] || 'info') as LogLevel;

  // KIS credentials
  const kisAppKey = getRequiredEnv('KIS_APP_KEY');
  const kisAppSecret = getRequiredEnv('KIS_APP_SECRET');
  const kisAccountNo = getRequiredEnv('KIS_ACCOUNT_NO');
  const kisAccountType = process.env['KIS_ACCOUNT_TYPE'] || '01'; // Default to paper trading

  // Database
  const dbHost = process.env['DB_HOST'] || 'localhost';
  const dbPort = parseInt(process.env['DB_PORT'] || '5432', 10);
  const dbName = getRequiredEnv('DB_NAME');
  const dbUser = getRequiredEnv('DB_USER');
  const dbPassword = getRequiredEnv('DB_PASSWORD');
  const dbMaxConnections = parseInt(process.env['DB_MAX_CONNECTIONS'] || '20', 10);

  // Redis
  const redisHost = process.env['REDIS_HOST'] || 'localhost';
  const redisPort = parseInt(process.env['REDIS_PORT'] || '6379', 10);
  const redisPassword = process.env['REDIS_PASSWORD'];
  const redisDb = parseInt(process.env['REDIS_DB'] || '0', 10);

  // Kafka (optional)
  const kafkaBrokers = process.env['KAFKA_BOOTSTRAP_SERVERS']?.split(',');
  const kafkaClientId = process.env['KAFKA_CLIENT_ID'] || 'auto-trading-system';
  const kafkaGroupId = process.env['KAFKA_GROUP_ID'] || 'auto-trading-system-group';

  // Risk limits
  const maxDailyLossPercent = parseFloat(process.env['MAX_DAILY_LOSS_PCT'] || '-0.02');
  const maxPositionCount = parseInt(process.env['MAX_POSITION_COUNT'] || '5', 10);
  const maxPositionWeightPercent = parseFloat(
    process.env['MAX_POSITION_WEIGHT_PCT'] || '0.20'
  );
  const maxConcentrationPercent = parseFloat(
    process.env['MAX_CONCENTRATION_PCT'] || '0.30'
  );
  const maxOrderSize = parseFloat(process.env['MAX_ORDER_SIZE'] || '10000000');
  const maxDrawdownPercent = parseFloat(process.env['MAX_DRAWDOWN_PCT'] || '-0.10');
  const minCashReservePercent = parseFloat(process.env['MIN_CASH_RESERVE_PCT'] || '0.10');

  // Alerts
  const slackWebhookUrl = process.env['SLACK_WEBHOOK_URL'];
  const smtpHost = process.env['SMTP_HOST'];
  const smtpPort = parseInt(process.env['SMTP_PORT'] || '587', 10);
  const smtpUser = process.env['SMTP_USER'];
  const smtpPassword = process.env['SMTP_PASSWORD'];
  const emailFrom = process.env['EMAIL_FROM'];
  const emailTo = process.env['EMAIL_TO']?.split(',');

  return {
    nodeEnv,
    logLevel,
    kis: {
      appKey: kisAppKey,
      appSecret: kisAppSecret,
      accountNo: kisAccountNo,
      accountType: kisAccountType,
      baseUrl: 'https://openapi.koreainvestment.com:9443',
      wsUrl: 'wss://openapi.koreainvestment.com:9443/ws',
    },
    postgres: {
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser,
      password: dbPassword,
      maxConnections: dbMaxConnections,
    },
    redis: {
      host: redisHost,
      port: redisPort,
      ...(redisPassword ? { password: redisPassword } : {}),
      db: redisDb,
    },
    ...(kafkaBrokers
      ? {
          kafka: {
            brokers: kafkaBrokers,
            clientId: kafkaClientId,
            groupId: kafkaGroupId,
          },
        }
      : {}),
    risk: {
      maxDailyLossPercent,
      maxPositionCount,
      maxPositionWeightPercent,
      maxConcentrationPercent,
      maxOrderSize,
      maxDrawdownPercent,
      minCashReservePercent,
    },
    alerts: {
      ...(slackWebhookUrl ? { slack: { webhookUrl: slackWebhookUrl } } : {}),
      ...(smtpHost && smtpUser && smtpPassword && emailFrom && emailTo
        ? {
            email: {
              smtpHost,
              smtpPort,
              smtpUser,
              smtpPassword,
              from: emailFrom,
              to: emailTo,
            },
          }
        : {}),
    },
  };
}

/**
 * Get required environment variable
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}
