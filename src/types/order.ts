/**
 * Order and position types for trading system
 */

import type { Symbol, Timestamp, KRW, Quantity, CorrelationId } from './common';

/**
 * Order side (buy or sell)
 */
export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

/**
 * Order type
 */
export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
  STOP_LIMIT = 'STOP_LIMIT',
}

/**
 * Order time in force
 */
export enum TimeInForce {
  DAY = 'DAY', // Good for day
  GTC = 'GTC', // Good till cancelled
  IOC = 'IOC', // Immediate or cancel
  FOK = 'FOK', // Fill or kill
}

/**
 * Order status
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

/**
 * Order creation request
 */
export interface OrderRequest {
  readonly symbol: Symbol;
  readonly side: OrderSide;
  readonly type: OrderType;
  readonly quantity: Quantity;
  readonly price?: KRW; // Required for LIMIT orders
  readonly stopPrice?: KRW; // Required for STOP orders
  readonly timeInForce: TimeInForce;
  readonly clientOrderId: string;
  readonly correlationId: CorrelationId;
  readonly reason: string; // Why this order is being placed
}

/**
 * Order entity
 */
export interface Order {
  readonly orderId: string;
  readonly clientOrderId: string;
  readonly symbol: Symbol;
  readonly side: OrderSide;
  readonly type: OrderType;
  readonly quantity: Quantity;
  readonly price?: KRW;
  readonly stopPrice?: KRW;
  readonly timeInForce: TimeInForce;
  readonly status: OrderStatus;
  readonly filledQuantity: Quantity;
  readonly averageFillPrice: KRW;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly submittedAt?: Timestamp;
  readonly filledAt?: Timestamp;
  readonly correlationId: CorrelationId;
  readonly reason: string;
  readonly rejectionReason?: string;
}

/**
 * Order execution/fill
 */
export interface Execution {
  readonly executionId: string;
  readonly orderId: string;
  readonly symbol: Symbol;
  readonly side: OrderSide;
  readonly executionPrice: KRW;
  readonly executionQuantity: Quantity;
  readonly fee: KRW;
  readonly tax: KRW;
  readonly timestamp: Timestamp;
  readonly correlationId: CorrelationId;
}

/**
 * Position entity
 */
export interface Position {
  readonly positionId: string;
  readonly symbol: Symbol;
  readonly quantity: Quantity;
  readonly averagePrice: KRW;
  readonly currentPrice: KRW;
  readonly unrealizedPnL: KRW;
  readonly realizedPnL: KRW;
  readonly totalCost: KRW;
  readonly marketValue: KRW;
  readonly openedAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/**
 * Portfolio balance
 */
export interface Balance {
  readonly totalAssets: KRW;
  readonly cash: KRW;
  readonly stockValue: KRW;
  readonly unrealizedPnL: KRW;
  readonly realizedPnL: KRW;
  readonly availableCash: KRW; // Cash available for trading
  readonly timestamp: Timestamp;
}

/**
 * Position update event
 */
export interface PositionUpdate {
  readonly position: Position;
  readonly previousQuantity: Quantity;
  readonly quantityChange: Quantity;
  readonly timestamp: Timestamp;
  readonly reason: string;
}

/**
 * Order state change event
 */
export interface OrderStateChange {
  readonly order: Order;
  readonly previousStatus: OrderStatus;
  readonly newStatus: OrderStatus;
  readonly timestamp: Timestamp;
  readonly reason?: string;
}

/**
 * Trade statistics
 */
export interface TradeStats {
  readonly totalTrades: number;
  readonly winningTrades: number;
  readonly losingTrades: number;
  readonly winRate: number; // Percentage
  readonly averageWin: KRW;
  readonly averageLoss: KRW;
  readonly profitFactor: number; // Gross profit / Gross loss
  readonly maxDrawdown: KRW;
  readonly sharpeRatio: number;
  readonly totalPnL: KRW;
}
