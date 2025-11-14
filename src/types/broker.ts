/**
 * Broker adapter types for trading system
 */

import type { Symbol, Timestamp } from './common';
import type { Order, OrderRequest, Position, Balance, Execution } from './order';
import type { Price } from './market';

/**
 * Broker adapter interface
 * Abstract interface for different broker APIs
 */
export interface BrokerAdapter {
  /**
   * Get current price for a symbol
   */
  getPrice(symbol: Symbol): Promise<Price>;

  /**
   * Get multiple prices at once
   */
  getPrices(symbols: readonly Symbol[]): Promise<readonly Price[]>;

  /**
   * Submit a new order
   */
  sendOrder(request: OrderRequest): Promise<Order>;

  /**
   * Cancel an existing order
   */
  cancelOrder(orderId: string): Promise<Order>;

  /**
   * Get order status
   */
  getOrder(orderId: string): Promise<Order>;

  /**
   * Get all open orders
   */
  getOpenOrders(): Promise<readonly Order[]>;

  /**
   * Get account balance
   */
  getBalance(): Promise<Balance>;

  /**
   * Get all positions
   */
  getPositions(): Promise<readonly Position[]>;

  /**
   * Get position for specific symbol
   */
  getPosition(symbol: Symbol): Promise<Position | null>;

  /**
   * Get order executions/fills
   */
  getExecutions(orderId: string): Promise<readonly Execution[]>;
}

/**
 * Authentication credentials
 */
export interface AuthCredentials {
  readonly appKey: string;
  readonly appSecret: string;
  readonly accountNo: string;
}

/**
 * Access token
 */
export interface AccessToken {
  readonly token: string;
  readonly expiresAt: Timestamp;
  readonly refreshToken?: string;
}

/**
 * Broker API response
 */
export interface BrokerResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: BrokerError;
  readonly timestamp: Timestamp;
}

/**
 * Broker API error
 */
export interface BrokerError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Rate limit information
 */
export interface RateLimit {
  readonly limit: number;
  readonly remaining: number;
  readonly reset: Timestamp;
}

/**
 * Broker connection status
 */
export enum BrokerConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR',
}

/**
 * WebSocket subscription
 */
export interface WebSocketSubscription {
  readonly subscriptionId: string;
  readonly symbols: readonly Symbol[];
  readonly channels: readonly string[];
}

/**
 * WebSocket message
 */
export interface WebSocketMessage<T = unknown> {
  readonly type: string;
  readonly data: T;
  readonly timestamp: Timestamp;
}

/**
 * Market data subscription
 */
export interface MarketDataSubscription {
  readonly symbol: Symbol;
  readonly interval?: string; // e.g., "1m", "5m", "1h"
  readonly fields: readonly string[]; // e.g., ["price", "volume", "orderbook"]
}
