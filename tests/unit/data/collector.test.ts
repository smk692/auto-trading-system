/**
 * Data Collector Tests
 * TDD RED Phase: Writing tests before implementation
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { DataCollector } from '@/data/collector';
import type { KISMarketAPI } from '@/broker/kis/market';
import type { Symbol, MarketBar, Price } from '@/types';

describe('DataCollector', () => {
  let collector: DataCollector;
  let mockMarketAPI: jest.Mocked<KISMarketAPI>;
  let mockDB: any;
  let mockRedis: any;

  beforeEach(() => {
    // Mock KISMarketAPI
    mockMarketAPI = {
      getPrice: jest.fn(),
      getPrices: jest.fn(),
      getHistoricalBars: jest.fn(),
      getOrderBook: jest.fn(),
      searchSymbol: jest.fn(),
    } as unknown as jest.Mocked<KISMarketAPI>;

    // Mock PostgreSQL client
    mockDB = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
    };

    // Mock Redis client
    mockRedis = {
      set: jest.fn(),
      get: jest.fn(),
      setEx: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    };

    collector = new DataCollector(mockMarketAPI, mockDB, mockRedis);
  });

  describe('collectCurrentPrice', () => {
    it('should fetch and cache current price', async () => {
      // Arrange
      const symbol: Symbol = '005930';
      const mockPrice: Price = {
        symbol,
        price: 70000,
        timestamp: new Date().toISOString(),
        source: 'KIS_REST',
      };

      mockMarketAPI.getPrice.mockResolvedValue(mockPrice);
      mockRedis.setEx.mockResolvedValue('OK');

      // Act
      const price = await collector.collectCurrentPrice(symbol);

      // Assert
      expect(mockMarketAPI.getPrice).toHaveBeenCalledWith(symbol);
      expect(mockRedis.setEx).toHaveBeenCalledWith(
        `price:${symbol}`,
        300, // 5 minutes TTL
        expect.any(String)
      );
      expect(price).toEqual(mockPrice);
    });

    it('should return cached price if available', async () => {
      // Arrange
      const symbol: Symbol = '005930';
      const cachedPrice = JSON.stringify({
        symbol,
        price: 70000,
        timestamp: new Date().toISOString(),
        source: 'KIS_REST',
      });

      mockRedis.get.mockResolvedValue(cachedPrice);

      // Act
      const price = await collector.collectCurrentPrice(symbol);

      // Assert
      expect(mockRedis.get).toHaveBeenCalledWith(`price:${symbol}`);
      expect(mockMarketAPI.getPrice).not.toHaveBeenCalled();
      expect(price.symbol).toBe(symbol);
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const symbol: Symbol = '005930';
      mockRedis.get.mockResolvedValue(null);
      mockMarketAPI.getPrice.mockRejectedValue(new Error('API error'));

      // Act & Assert
      await expect(collector.collectCurrentPrice(symbol)).rejects.toThrow('API error');
    });
  });

  describe('collectHistoricalData', () => {
    it('should fetch and store historical bars in database', async () => {
      // Arrange
      const symbol: Symbol = '005930';
      const startDate = '20240101';
      const endDate = '20240131';
      const interval = 'D';

      const mockBars: MarketBar[] = [
        {
          barId: '005930-20240102-0',
          timestamp: '2024-01-02T00:00:00.000Z',
          symbol,
          open: 70000,
          high: 71000,
          low: 69000,
          close: 70500,
          volume: 10000000,
          source: 'KIS_REST',
        },
        {
          barId: '005930-20240103-1',
          timestamp: '2024-01-03T00:00:00.000Z',
          symbol,
          open: 70500,
          high: 72000,
          low: 70000,
          close: 71500,
          volume: 12000000,
          source: 'KIS_REST',
        },
      ];

      mockMarketAPI.getHistoricalBars.mockResolvedValue(mockBars);
      mockDB.query.mockResolvedValue({ rowCount: 2 });

      // Act
      const result = await collector.collectHistoricalData(symbol, startDate, endDate, interval);

      // Assert
      expect(mockMarketAPI.getHistoricalBars).toHaveBeenCalledWith(
        symbol,
        startDate,
        endDate,
        interval
      );
      expect(mockDB.query).toHaveBeenCalled();
      expect(result.barsCollected).toBe(2);
      expect(result.symbol).toBe(symbol);
    });

    it('should handle duplicate bars (upsert)', async () => {
      // Arrange
      const symbol: Symbol = '005930';
      const startDate = '20240101';
      const endDate = '20240102';
      const interval = 'D';

      const mockBars: MarketBar[] = [
        {
          barId: '005930-20240102-0',
          timestamp: '2024-01-02T00:00:00.000Z',
          symbol,
          open: 70000,
          high: 71000,
          low: 69000,
          close: 70500,
          volume: 10000000,
          source: 'KIS_REST',
        },
      ];

      mockMarketAPI.getHistoricalBars.mockResolvedValue(mockBars);
      mockDB.query.mockResolvedValue({ rowCount: 1 });

      // Act
      const result = await collector.collectHistoricalData(symbol, startDate, endDate, interval);

      // Assert - Should use INSERT ... ON CONFLICT DO UPDATE
      expect(mockDB.query).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT'),
        expect.any(Array)
      );
      expect(result.barsCollected).toBe(1);
    });

    it('should validate date range before fetching', async () => {
      // Arrange
      const symbol: Symbol = '005930';
      const startDate = '20240201';
      const endDate = '20240101'; // Invalid: end before start

      // Act & Assert
      await expect(
        collector.collectHistoricalData(symbol, startDate, endDate, 'D')
      ).rejects.toThrow('Invalid date range');
    });
  });

  describe('collectMultipleSymbols', () => {
    it('should collect prices for multiple symbols concurrently', async () => {
      // Arrange
      const symbols: readonly Symbol[] = ['005930', '000660', '035420'];

      const mockPrices: Price[] = [
        { symbol: '005930', price: 70000, timestamp: new Date().toISOString(), source: 'KIS_REST' },
        { symbol: '000660', price: 50000, timestamp: new Date().toISOString(), source: 'KIS_REST' },
        { symbol: '035420', price: 30000, timestamp: new Date().toISOString(), source: 'KIS_REST' },
      ];

      mockMarketAPI.getPrices.mockResolvedValue(mockPrices);
      mockRedis.setEx.mockResolvedValue('OK');

      // Act
      const result = await collector.collectMultipleSymbols(symbols);

      // Assert
      expect(mockMarketAPI.getPrices).toHaveBeenCalledWith(symbols);
      expect(result.success).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle partial failures gracefully', async () => {
      // Arrange
      const symbols: readonly Symbol[] = ['005930', 'INVALID', '035420'];

      const mockPrices: Price[] = [
        { symbol: '005930', price: 70000, timestamp: new Date().toISOString(), source: 'KIS_REST' },
        { symbol: '035420', price: 30000, timestamp: new Date().toISOString(), source: 'KIS_REST' },
      ];

      mockMarketAPI.getPrices.mockResolvedValue(mockPrices);
      mockRedis.setEx.mockResolvedValue('OK');

      // Act
      const result = await collector.collectMultipleSymbols(symbols);

      // Assert
      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0]).toBe('INVALID');
    });
  });

  describe('addToWatchlist', () => {
    it('should add symbols to watchlist', async () => {
      // Arrange
      const watchlistName = 'My Stocks';
      const symbols: readonly Symbol[] = ['005930', '000660'];

      mockDB.query.mockResolvedValue({ rowCount: 1, rows: [{ watchlist_id: 'wl-123' }] });

      // Act
      const watchlist = await collector.addToWatchlist(watchlistName, symbols);

      // Assert
      expect(mockDB.query).toHaveBeenCalled();
      expect(watchlist.name).toBe(watchlistName);
      expect(watchlist.symbols).toEqual(symbols);
    });

    it('should update existing watchlist', async () => {
      // Arrange
      const watchlistName = 'My Stocks';
      const newSymbols: readonly Symbol[] = ['035420'];

      mockDB.query.mockResolvedValue({ rowCount: 1, rows: [{ watchlist_id: 'wl-123' }] });

      // Act
      const watchlist = await collector.addToWatchlist(watchlistName, newSymbols);

      // Assert
      expect(mockDB.query).toHaveBeenCalled();
      expect(watchlist.symbols).toContain('035420');
    });
  });

  describe('getWatchlist', () => {
    it('should retrieve watchlist by name', async () => {
      // Arrange
      const watchlistName = 'My Stocks';
      const mockRows = [
        {
          watchlist_id: 'wl-123',
          name: watchlistName,
          symbols: ['005930', '000660'],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDB.query.mockResolvedValue({ rows: mockRows });

      // Act
      const watchlist = await collector.getWatchlist(watchlistName);

      // Assert
      expect(watchlist).toBeDefined();
      expect(watchlist?.name).toBe(watchlistName);
      expect(watchlist?.symbols).toHaveLength(2);
    });

    it('should return null if watchlist not found', async () => {
      // Arrange
      mockDB.query.mockResolvedValue({ rows: [] });

      // Act
      const watchlist = await collector.getWatchlist('NonExistent');

      // Assert
      expect(watchlist).toBeNull();
    });
  });

  describe('startScheduledCollection', () => {
    it('should start periodic data collection', async () => {
      // Arrange
      const symbols: readonly Symbol[] = ['005930'];
      const intervalMs = 1000; // 1 second for testing

      // Act
      collector.startScheduledCollection(symbols, intervalMs);

      // Assert
      expect(collector.isCollecting()).toBe(true);
    });

    it('should stop scheduled collection', async () => {
      // Arrange
      const symbols: readonly Symbol[] = ['005930'];
      const intervalMs = 1000;

      collector.startScheduledCollection(symbols, intervalMs);

      // Act
      collector.stopScheduledCollection();

      // Assert
      expect(collector.isCollecting()).toBe(false);
    });
  });

  describe('data validation', () => {
    it('should validate price data before storing', async () => {
      // Arrange
      const symbol: Symbol = '005930';
      const invalidPrice: any = {
        symbol,
        price: -1000, // Invalid: negative price
        timestamp: new Date().toISOString(),
        source: 'KIS_REST',
      };

      mockMarketAPI.getPrice.mockResolvedValue(invalidPrice);

      // Act & Assert
      await expect(collector.collectCurrentPrice(symbol)).rejects.toThrow('Invalid price');
    });

    it('should validate bar data completeness', async () => {
      // Arrange
      const symbol: Symbol = '005930';
      const incompleteBars: any[] = [
        {
          // Missing required fields
          symbol,
          open: 70000,
        },
      ];

      mockMarketAPI.getHistoricalBars.mockResolvedValue(incompleteBars);

      // Act & Assert
      await expect(
        collector.collectHistoricalData(symbol, '20240101', '20240102', 'D')
      ).rejects.toThrow('Incomplete bar data');
    });
  });
});
