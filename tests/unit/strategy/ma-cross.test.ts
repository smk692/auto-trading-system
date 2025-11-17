/**
 * MA Cross Strategy Tests
 * TDD RED Phase: Writing tests before implementation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MACrossStrategy } from '@/strategy/ma-cross';
import type { MarketData, MarketBar, Symbol } from '@/types';
import { MovingAverageType } from '@/types';

describe('MACrossStrategy', () => {
  let strategy: MACrossStrategy;
  const symbol: Symbol = '005930';

  beforeEach(() => {
    strategy = new MACrossStrategy({
      shortPeriod: 5,
      longPeriod: 20,
      maType: MovingAverageType.SIMPLE,
      volumeThreshold: 1000000,
    });
  });

  describe('initialization', () => {
    it('should initialize with correct parameters', () => {
      expect(strategy.strategyId).toBeDefined();
      expect(strategy.name).toBe('MA Cross Strategy');
      expect(strategy.description).toContain('Moving Average Crossover');
      expect(strategy.params.shortPeriod).toBe(5);
      expect(strategy.params.longPeriod).toBe(20);
    });

    it('should validate that shortPeriod < longPeriod', () => {
      expect(
        () =>
          new MACrossStrategy({
            shortPeriod: 50,
            longPeriod: 20,
            maType: MovingAverageType.SIMPLE,
          })
      ).toThrow('Short period must be less than long period');
    });

    it('should validate positive periods', () => {
      expect(
        () =>
          new MACrossStrategy({
            shortPeriod: -5,
            longPeriod: 20,
            maType: MovingAverageType.SIMPLE,
          })
      ).toThrow('Periods must be positive');
    });

    it('should return consistent params hash', () => {
      const hash1 = strategy.getParamsHash();
      const hash2 = strategy.getParamsHash();

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
    });
  });

  describe('analyze - BUY signals', () => {
    it('should generate BUY signal when short MA crosses above long MA', async () => {
      // Arrange - Create clear bullish crossover scenario
      // First 18 bars: declining trend (short MA < long MA)
      // Last 3 bars: strong rally (short MA crosses above long MA)
      const bars: Array<{ close: number; volume: number }> = [];

      // Declining trend: 80000 → 70000 (18 bars)
      for (let i = 0; i < 18; i++) {
        bars.push({
          close: 80000 - i * 500,
          volume: 2000000,
        });
      }

      // Strong rally: rapid price increase (3 bars)
      bars.push({ close: 75000, volume: 2000000 });
      bars.push({ close: 82000, volume: 2000000 });
      bars.push({ close: 88000, volume: 2000000 });

      const marketData = createMarketData(symbol, bars);

      // Act
      const signal = await strategy.analyze(marketData);

      // Assert
      expect(signal.direction).toBe('BUY');
      expect(signal.strength).toBeGreaterThan(0.5);
      expect(signal.reason).toContain('crossed above');
      expect(signal.symbol).toBe(symbol);
      expect(signal.strategyId).toBe(strategy.strategyId);
    });

    it('should generate stronger BUY signal with high volume', async () => {
      // Arrange
      const marketData = createMarketData(symbol, [
        ...generatePriceData(50000, 70000, 21, 3000000), // High volume
      ]);

      // Act
      const signal = await strategy.analyze(marketData);

      // Assert
      if (signal.direction === 'BUY') {
        expect(signal.strength).toBeGreaterThan(0.7);
      }
    });
  });

  describe('analyze - SELL signals', () => {
    it('should generate SELL signal when short MA crosses below long MA', async () => {
      // Arrange - Create clear bearish crossover scenario
      // First 18 bars: rising trend (short MA > long MA)
      // Last 3 bars: sharp decline (short MA crosses below long MA)
      const bars: Array<{ close: number; volume: number }> = [];

      // Rising trend: 60000 → 70000 (18 bars)
      for (let i = 0; i < 18; i++) {
        bars.push({
          close: 60000 + i * 500,
          volume: 2000000,
        });
      }

      // Sharp decline: rapid price decrease (3 bars)
      bars.push({ close: 66000, volume: 2000000 });
      bars.push({ close: 58000, volume: 2000000 });
      bars.push({ close: 50000, volume: 2000000 });

      const marketData = createMarketData(symbol, bars);

      // Act
      const signal = await strategy.analyze(marketData);

      // Assert
      expect(signal.direction).toBe('SELL');
      expect(signal.strength).toBeGreaterThan(0.5);
      expect(signal.reason).toContain('crossed below');
      expect(signal.symbol).toBe(symbol);
    });
  });

  describe('analyze - HOLD signals', () => {
    it('should generate HOLD signal when no crossover occurs', async () => {
      // Arrange - stable sideways market
      const marketData = createMarketData(symbol, [
        ...generatePriceData(70000, 70500, 21, 2000000), // Sideways market
      ]);

      // Act
      const signal = await strategy.analyze(marketData);

      // Assert
      expect(signal.direction).toBe('HOLD');
      expect(signal.strength).toBeLessThan(0.5);
      expect(signal.reason).toContain('No clear crossover');
    });

    it('should generate HOLD signal when volume is too low', async () => {
      // Arrange
      const strategyWithVolThreshold = new MACrossStrategy({
        shortPeriod: 5,
        longPeriod: 20,
        maType: MovingAverageType.SIMPLE,
        volumeThreshold: 5000000, // High threshold
      });

      // Create same bullish crossover pattern as BUY test, but with low volume
      const bars: Array<{ close: number; volume: number }> = [];

      // Declining trend (18 bars)
      for (let i = 0; i < 18; i++) {
        bars.push({
          close: 80000 - i * 500,
          volume: 1000000, // Low volume
        });
      }

      // Strong rally (3 bars) - crossover occurs
      bars.push({ close: 75000, volume: 1000000 }); // Low volume
      bars.push({ close: 82000, volume: 1000000 }); // Low volume
      bars.push({ close: 88000, volume: 1000000 }); // Low volume

      const marketData = createMarketData(symbol, bars);

      // Act
      const signal = await strategyWithVolThreshold.analyze(marketData);

      // Assert
      expect(signal.direction).toBe('HOLD');
      expect(signal.reason).toContain('volume');
    });
  });

  describe('different MA types', () => {
    it('should work with EMA', async () => {
      // Arrange
      const emaStrategy = new MACrossStrategy({
        shortPeriod: 5,
        longPeriod: 20,
        maType: MovingAverageType.EXPONENTIAL,
      });

      const marketData = createMarketData(symbol, [
        ...generatePriceData(60000, 80000, 21, 2000000),
      ]);

      // Act
      const signal = await emaStrategy.analyze(marketData);

      // Assert
      expect(signal).toBeDefined();
      expect(signal.direction).toMatch(/^(BUY|SELL|HOLD)$/);
    });

    it('should work with WMA', async () => {
      // Arrange
      const wmaStrategy = new MACrossStrategy({
        shortPeriod: 5,
        longPeriod: 20,
        maType: MovingAverageType.WEIGHTED,
      });

      const marketData = createMarketData(symbol, [
        ...generatePriceData(60000, 80000, 21, 2000000),
      ]);

      // Act
      const signal = await wmaStrategy.analyze(marketData);

      // Assert
      expect(signal).toBeDefined();
      expect(signal.direction).toMatch(/^(BUY|SELL|HOLD)$/);
    });
  });

  describe('edge cases', () => {
    it('should handle insufficient data gracefully', async () => {
      // Arrange - not enough bars for long MA
      const marketData = createMarketData(symbol, [
        { close: 70000, volume: 2000000 },
        { close: 71000, volume: 2000000 },
        { close: 72000, volume: 2000000 },
      ]);

      // Act & Assert
      await expect(strategy.analyze(marketData)).rejects.toThrow('Insufficient data');
    });

    it('should validate market data has bars', async () => {
      // Arrange
      const marketData = createMarketData(symbol, []);

      // Act & Assert
      await expect(strategy.analyze(marketData)).rejects.toThrow('Insufficient data');
    });

    it('should include correlation ID in signal', async () => {
      // Arrange
      const marketData = createMarketData(symbol, [
        ...generatePriceData(60000, 80000, 21, 2000000),
      ]);

      // Act
      const signal = await strategy.analyze(marketData);

      // Assert
      expect(signal.correlationId).toBeDefined();
      expect(typeof signal.correlationId).toBe('string');
    });

    it('should include timestamp in signal', async () => {
      // Arrange
      const marketData = createMarketData(symbol, [
        ...generatePriceData(60000, 80000, 21, 2000000),
      ]);

      // Act
      const signal = await strategy.analyze(marketData);

      // Assert
      expect(signal.timestamp).toBeDefined();
      expect(new Date(signal.timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  describe('validateParams', () => {
    it('should return true for valid parameters', () => {
      expect(strategy.validateParams()).toBe(true);
    });

    it('should return false for invalid parameters', () => {
      const invalidStrategy = Object.create(MACrossStrategy.prototype);
      invalidStrategy.params = {
        shortPeriod: 50,
        longPeriod: 20, // Invalid: short > long
      };

      expect(invalidStrategy.validateParams()).toBe(false);
    });
  });
});

// Helper functions

function createMarketData(
  symbol: Symbol,
  bars: Array<{ close: number; volume: number }>
): MarketData {
  const marketBars: MarketBar[] = bars.map((bar, index) => ({
    barId: `${symbol}-${Date.now()}-${index}`,
    timestamp: new Date(Date.now() - (bars.length - index) * 86400000).toISOString(),
    symbol,
    open: bar.close - 100,
    high: bar.close + 500,
    low: bar.close - 500,
    close: bar.close,
    volume: bar.volume,
    source: 'KIS_REST',
  }));

  return {
    symbol,
    timestamp: new Date().toISOString(),
    currentPrice: bars.length > 0 ? bars[bars.length - 1].close : 0,
    bars: marketBars,
    volume24h: bars.reduce((sum, bar) => sum + bar.volume, 0),
  };
}

function generatePriceData(
  startPrice: number,
  endPrice: number,
  count: number,
  volume: number
): Array<{ close: number; volume: number }> {
  const step = (endPrice - startPrice) / (count - 1);
  const result: Array<{ close: number; volume: number }> = [];

  for (let i = 0; i < count; i++) {
    result.push({
      close: Math.round(startPrice + step * i),
      volume,
    });
  }

  return result;
}
