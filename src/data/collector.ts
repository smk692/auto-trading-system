/**
 * Data Collector
 * Collects market data and stores in database/cache
 */

import type { KISMarketAPI } from '@/broker/kis/market';
import type { Symbol, Price, MarketBar, Watchlist } from '@/types';
import type { Client as PGClient } from 'pg';
import type { RedisClientType } from 'redis';

/**
 * Collection result for multiple symbols
 */
export interface CollectionResult {
  readonly success: readonly Symbol[];
  readonly failed: readonly Symbol[];
  readonly errors: ReadonlyMap<Symbol, string>;
}

/**
 * Historical data collection result
 */
export interface HistoricalCollectionResult {
  readonly symbol: Symbol;
  readonly barsCollected: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly interval: string;
}

/**
 * Data Collector for market data
 */
export class DataCollector {
  private collectingInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly marketAPI: KISMarketAPI,
    private readonly db: PGClient,
    private readonly redis: RedisClientType
  ) {}

  /**
   * Collect current price for a symbol
   */
  async collectCurrentPrice(symbol: Symbol): Promise<Price> {
    // Check cache first
    const cacheKey = `price:${symbol}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from API
    const price = await this.marketAPI.getPrice(symbol);

    // Validate price
    this.validatePrice(price);

    // Cache for 5 minutes
    await this.redis.setEx(cacheKey, 300, JSON.stringify(price));

    return price;
  }

  /**
   * Collect historical data and store in database
   */
  async collectHistoricalData(
    symbol: Symbol,
    startDate: string,
    endDate: string,
    interval: string
  ): Promise<HistoricalCollectionResult> {
    // Validate date range
    if (startDate > endDate) {
      throw new Error('Invalid date range: start date must be before or equal to end date');
    }

    // Fetch historical bars
    const bars = await this.marketAPI.getHistoricalBars(symbol, startDate, endDate, interval);

    // Validate bars
    for (const bar of bars) {
      this.validateBar(bar);
    }

    // Store in database with upsert
    const query = `
      INSERT INTO market_bars (
        bar_id, ts, symbol, open, high, low, close, volume, source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (bar_id) DO UPDATE SET
        ts = EXCLUDED.ts,
        open = EXCLUDED.open,
        high = EXCLUDED.high,
        low = EXCLUDED.low,
        close = EXCLUDED.close,
        volume = EXCLUDED.volume,
        source = EXCLUDED.source
    `;

    let barsCollected = 0;
    for (const bar of bars) {
      await this.db.query(query, [
        bar.barId,
        bar.timestamp,
        bar.symbol,
        bar.open,
        bar.high,
        bar.low,
        bar.close,
        bar.volume,
        bar.source,
      ]);
      barsCollected++;
    }

    return {
      symbol,
      barsCollected,
      startDate,
      endDate,
      interval,
    };
  }

  /**
   * Collect prices for multiple symbols
   */
  async collectMultipleSymbols(symbols: readonly Symbol[]): Promise<CollectionResult> {
    const success: Symbol[] = [];
    const failed: Symbol[] = [];
    const errors = new Map<Symbol, string>();

    // Fetch prices from API
    const prices = await this.marketAPI.getPrices(symbols);

    // Process prices
    for (const price of prices) {
      try {
        this.validatePrice(price);

        // Cache each price
        const cacheKey = `price:${price.symbol}`;
        await this.redis.setEx(cacheKey, 300, JSON.stringify(price));

        success.push(price.symbol);
      } catch (error) {
        failed.push(price.symbol);
        errors.set(price.symbol, (error as Error).message);
      }
    }

    // Check for symbols that didn't return prices
    for (const symbol of symbols) {
      if (!prices.find((p) => p.symbol === symbol)) {
        failed.push(symbol);
        errors.set(symbol, 'No price data returned');
      }
    }

    return {
      success,
      failed,
      errors,
    };
  }

  /**
   * Add symbols to watchlist
   */
  async addToWatchlist(name: string, symbols: readonly Symbol[]): Promise<Watchlist> {
    const now = new Date().toISOString();

    // Check if watchlist exists
    const checkQuery = 'SELECT watchlist_id, symbols FROM watchlists WHERE name = $1';
    const checkResult = await this.db.query(checkQuery, [name]);

    let watchlistId: string;
    let allSymbols: Symbol[];

    if (checkResult.rows.length > 0) {
      // Update existing watchlist
      watchlistId = checkResult.rows[0].watchlist_id;
      const existingSymbols = checkResult.rows[0].symbols || [];
      allSymbols = [...new Set([...existingSymbols, ...symbols])];

      const updateQuery = `
        UPDATE watchlists
        SET symbols = $1, updated_at = $2
        WHERE watchlist_id = $3
        RETURNING *
      `;

      await this.db.query(updateQuery, [allSymbols, now, watchlistId]);
    } else {
      // Create new watchlist
      watchlistId = `wl-${Date.now()}`;
      allSymbols = [...symbols];

      const insertQuery = `
        INSERT INTO watchlists (watchlist_id, name, symbols, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      await this.db.query(insertQuery, [watchlistId, name, allSymbols, now, now]);
    }

    return {
      watchlistId,
      name,
      symbols: allSymbols,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Get watchlist by name
   */
  async getWatchlist(name: string): Promise<Watchlist | null> {
    const query = 'SELECT * FROM watchlists WHERE name = $1';
    const result = await this.db.query(query, [name]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      watchlistId: row.watchlist_id,
      name: row.name,
      symbols: row.symbols || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Start scheduled data collection
   */
  startScheduledCollection(symbols: readonly Symbol[], intervalMs: number): void {
    if (this.collectingInterval) {
      throw new Error('Collection already running. Stop it first.');
    }

    this.collectingInterval = setInterval(async () => {
      try {
        await this.collectMultipleSymbols(symbols);
      } catch (error) {
        console.error('Scheduled collection error:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop scheduled data collection
   */
  stopScheduledCollection(): void {
    if (this.collectingInterval) {
      clearInterval(this.collectingInterval);
      this.collectingInterval = null;
    }
  }

  /**
   * Check if collector is running
   */
  isCollecting(): boolean {
    return this.collectingInterval !== null;
  }

  /**
   * Validate price data
   */
  private validatePrice(price: Price): void {
    if (price.price < 0) {
      throw new Error('Invalid price: price cannot be negative');
    }

    if (!price.symbol || price.symbol.trim() === '') {
      throw new Error('Invalid price: symbol is required');
    }

    if (!price.timestamp) {
      throw new Error('Invalid price: timestamp is required');
    }
  }

  /**
   * Validate bar data
   */
  private validateBar(bar: MarketBar): void {
    const requiredFields = ['barId', 'timestamp', 'symbol', 'open', 'high', 'low', 'close', 'volume'];

    for (const field of requiredFields) {
      if (!(field in bar) || (bar as any)[field] === undefined || (bar as any)[field] === null) {
        throw new Error(`Incomplete bar data: missing field '${field}'`);
      }
    }

    // Validate OHLC relationships
    if (bar.high < bar.low) {
      throw new Error('Invalid bar: high must be >= low');
    }

    if (bar.open < 0 || bar.high < 0 || bar.low < 0 || bar.close < 0) {
      throw new Error('Invalid bar: prices cannot be negative');
    }

    if (bar.volume < 0) {
      throw new Error('Invalid bar: volume cannot be negative');
    }
  }
}
