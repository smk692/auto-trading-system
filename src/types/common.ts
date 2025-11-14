/**
 * Common types used across the trading system
 */

/**
 * ISO 8601 timestamp string
 */
export type Timestamp = string;

/**
 * Correlation ID for tracing requests across services
 */
export type CorrelationId = string;

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Symbol code (e.g., "005930" for Samsung)
 */
export type Symbol = string;

/**
 * Korean Won currency type
 */
export type KRW = number;

/**
 * Percentage value (0.0 to 1.0)
 */
export type Percentage = number;

/**
 * Quantity of shares
 */
export type Quantity = number;

/**
 * Trading direction
 */
export enum Direction {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
}

/**
 * Market type
 */
export enum Market {
  KOSPI = 'KOSPI',
  KOSDAQ = 'KOSDAQ',
  KONEX = 'KONEX',
}

/**
 * Status enumeration
 */
export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

/**
 * Configuration version tracking
 */
export interface ConfigVersion {
  readonly version: number;
  readonly timestamp: Timestamp;
  readonly hash: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  readonly limit: number;
  readonly offset: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}

/**
 * Error codes for the trading system
 */
export enum ErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',

  // Authentication errors
  AUTH_FAILED = 'AUTH_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Broker API errors
  BROKER_API_ERROR = 'BROKER_API_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',

  // Order errors
  ORDER_REJECTED = 'ORDER_REJECTED',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  DUPLICATE_ORDER = 'DUPLICATE_ORDER',

  // Risk management errors
  RISK_LIMIT_EXCEEDED = 'RISK_LIMIT_EXCEEDED',
  KILL_SWITCH_ACTIVE = 'KILL_SWITCH_ACTIVE',

  // Data errors
  INVALID_MARKET_DATA = 'INVALID_MARKET_DATA',
  DATA_VALIDATION_FAILED = 'DATA_VALIDATION_FAILED',
}

/**
 * Trading system error
 */
export class TradingError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TradingError';
    Object.setPrototypeOf(this, TradingError.prototype);
  }
}
