/**
 * Market data types for trading system
 */

import type { Symbol, Timestamp, KRW, Quantity, Market, Status } from './common';

/**
 * Symbol metadata
 */
export interface SymbolInfo {
  readonly symbolId: string;
  readonly symbol: Symbol;
  readonly name: string;
  readonly market: Market;
  readonly status: Status;
}

/**
 * Price information
 */
export interface Price {
  readonly symbol: Symbol;
  readonly price: KRW;
  readonly timestamp: Timestamp;
  readonly source: string;
}

/**
 * OHLCV (Open, High, Low, Close, Volume) bar data
 */
export interface MarketBar {
  readonly barId: string;
  readonly timestamp: Timestamp;
  readonly symbol: Symbol;
  readonly open: KRW;
  readonly high: KRW;
  readonly low: KRW;
  readonly close: KRW;
  readonly volume: Quantity;
  readonly source: string;
}

/**
 * Real-time tick data
 */
export interface TickData {
  readonly symbol: Symbol;
  readonly timestamp: Timestamp;
  readonly price: KRW;
  readonly volume: Quantity;
  readonly bidPrice: KRW;
  readonly askPrice: KRW;
  readonly bidVolume: Quantity;
  readonly askVolume: Quantity;
}

/**
 * Aggregated market data with technical indicators
 */
export interface MarketData {
  readonly symbol: Symbol;
  readonly timestamp: Timestamp;
  readonly currentPrice: KRW;
  readonly bars: readonly MarketBar[];
  readonly volume24h: Quantity;
  readonly indicators?: MarketIndicators;
}

/**
 * Technical indicators
 */
export interface MarketIndicators {
  readonly ma5?: number;
  readonly ma20?: number;
  readonly ma50?: number;
  readonly ma200?: number;
  readonly rsi?: number;
  readonly macd?: {
    readonly macd: number;
    readonly signal: number;
    readonly histogram: number;
  };
  readonly bollingerBands?: {
    readonly upper: number;
    readonly middle: number;
    readonly lower: number;
  };
}

/**
 * Order book (depth of market)
 */
export interface OrderBook {
  readonly symbol: Symbol;
  readonly timestamp: Timestamp;
  readonly bids: readonly OrderBookLevel[];
  readonly asks: readonly OrderBookLevel[];
}

/**
 * Order book level
 */
export interface OrderBookLevel {
  readonly price: KRW;
  readonly volume: Quantity;
}

/**
 * Market data source enumeration
 */
export enum MarketDataSource {
  KIS_REST = 'KIS_REST',
  KIS_WEBSOCKET = 'KIS_WEBSOCKET',
  BACKTEST = 'BACKTEST',
  SIMULATOR = 'SIMULATOR',
}

/**
 * Watchlist for monitoring symbols
 */
export interface Watchlist {
  readonly watchlistId: string;
  readonly name: string;
  readonly symbols: readonly Symbol[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/**
 * Market session information
 */
export interface MarketSession {
  readonly date: string; // YYYY-MM-DD
  readonly market: Market;
  readonly isOpen: boolean;
  readonly openTime?: Timestamp;
  readonly closeTime?: Timestamp;
  readonly preMarketOpen?: Timestamp;
  readonly postMarketClose?: Timestamp;
}
