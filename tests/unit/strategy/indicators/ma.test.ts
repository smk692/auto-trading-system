/**
 * Moving Average Indicator Tests
 * TDD RED Phase: Writing tests before implementation
 */

import { describe, it, expect } from '@jest/globals';
import { MovingAverage, calculateSMA, calculateEMA } from '@/strategy/indicators/ma';
import { MovingAverageType } from '@/types';

describe('Moving Average Indicators', () => {
  describe('calculateSMA (Simple Moving Average)', () => {
    it('should calculate SMA correctly', () => {
      // Arrange
      const data = [10, 20, 30, 40, 50];
      const period = 3;

      // Act
      const result = calculateSMA(data, period);

      // Assert
      expect(result).toHaveLength(3); // 5 - 3 + 1 = 3 values
      expect(result[0]).toBeCloseTo(20); // (10 + 20 + 30) / 3 = 20
      expect(result[1]).toBeCloseTo(30); // (20 + 30 + 40) / 3 = 30
      expect(result[2]).toBeCloseTo(40); // (30 + 40 + 50) / 3 = 40
    });

    it('should return empty array when data length < period', () => {
      // Arrange
      const data = [10, 20];
      const period = 5;

      // Act
      const result = calculateSMA(data, period);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle single period', () => {
      // Arrange
      const data = [10, 20, 30];
      const period = 1;

      // Act
      const result = calculateSMA(data, period);

      // Assert
      expect(result).toEqual(data);
    });

    it('should handle period equal to data length', () => {
      // Arrange
      const data = [10, 20, 30, 40, 50];
      const period = 5;

      // Act
      const result = calculateSMA(data, period);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBeCloseTo(30); // (10 + 20 + 30 + 40 + 50) / 5 = 30
    });
  });

  describe('calculateEMA (Exponential Moving Average)', () => {
    it('should calculate EMA correctly', () => {
      // Arrange
      const data = [10, 20, 30, 40, 50];
      const period = 3;

      // Act
      const result = calculateEMA(data, period);

      // Assert
      expect(result).toHaveLength(5);
      // First EMA value is SMA
      expect(result[0]).toBeCloseTo(10);
      // Subsequent values use EMA formula: EMA = (Close - PrevEMA) * multiplier + PrevEMA
      // multiplier = 2 / (period + 1) = 2 / 4 = 0.5
      expect(result[2]).toBeCloseTo(20); // Initial SMA for first 3 values: (10 + 20 + 30) / 3 = 20
    });

    it('should return empty array when data length < period', () => {
      // Arrange
      const data = [10, 20];
      const period = 5;

      // Act
      const result = calculateEMA(data, period);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle period of 1', () => {
      // Arrange
      const data = [10, 20, 30];
      const period = 1;

      // Act
      const result = calculateEMA(data, period);

      // Assert
      expect(result).toEqual(data);
    });
  });

  describe('MovingAverage class', () => {
    it('should calculate SMA using the class interface', () => {
      // Arrange
      const ma = new MovingAverage(MovingAverageType.SIMPLE, 3);
      const data = [10, 20, 30, 40, 50];

      // Act
      const result = ma.calculate(data);

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect((result as number[]).length).toBe(3);
      expect((result as number[])[0]).toBeCloseTo(20);
    });

    it('should calculate EMA using the class interface', () => {
      // Arrange
      const ma = new MovingAverage(MovingAverageType.EXPONENTIAL, 3);
      const data = [10, 20, 30, 40, 50];

      // Act
      const result = ma.calculate(data);

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect((result as number[]).length).toBe(5);
    });

    it('should have correct name property', () => {
      // Arrange & Act
      const sma = new MovingAverage(MovingAverageType.SIMPLE, 20);
      const ema = new MovingAverage(MovingAverageType.EXPONENTIAL, 50);

      // Assert
      expect(sma.name).toBe('SMA(20)');
      expect(ema.name).toBe('EMA(50)');
    });

    it('should validate period is positive', () => {
      // Act & Assert
      expect(() => new MovingAverage(MovingAverageType.SIMPLE, 0)).toThrow('Period must be positive');
      expect(() => new MovingAverage(MovingAverageType.SIMPLE, -5)).toThrow('Period must be positive');
    });
  });

  describe('edge cases', () => {
    it('should handle empty data array', () => {
      // Arrange
      const data: number[] = [];
      const period = 5;

      // Act
      const smaResult = calculateSMA(data, period);
      const emaResult = calculateEMA(data, period);

      // Assert
      expect(smaResult).toEqual([]);
      expect(emaResult).toEqual([]);
    });

    it('should handle data with NaN values', () => {
      // Arrange
      const data = [10, 20, NaN, 40, 50];
      const period = 3;

      // Act & Assert
      expect(() => calculateSMA(data, period)).toThrow('Data contains invalid values');
    });

    it('should handle data with Infinity values', () => {
      // Arrange
      const data = [10, 20, Infinity, 40, 50];
      const period = 3;

      // Act & Assert
      expect(() => calculateSMA(data, period)).toThrow('Data contains invalid values');
    });
  });
});
