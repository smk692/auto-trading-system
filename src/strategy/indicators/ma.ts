/**
 * Moving Average Indicators
 * Implements SMA, EMA, and other moving average calculations
 */

import { Indicator, MovingAverageType } from '@/types';

/**
 * Calculate Simple Moving Average (SMA)
 * @param data - Array of numbers (e.g., closing prices)
 * @param period - Number of periods for the moving average
 * @returns Array of SMA values
 */
export function calculateSMA(data: readonly number[], period: number): number[] {
  // Validate input
  validateData(data);

  if (data.length < period) {
    return [];
  }

  if (period === 1) {
    return [...data];
  }

  const result: number[] = [];

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }

  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * @param data - Array of numbers (e.g., closing prices)
 * @param period - Number of periods for the moving average
 * @returns Array of EMA values
 */
export function calculateEMA(data: readonly number[], period: number): number[] {
  // Validate input
  validateData(data);

  if (data.length < period) {
    return [];
  }

  if (period === 1) {
    return [...data];
  }

  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  // First EMA value is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  const initialEMA = sum / period;

  // Fill initial values with data (for alignment)
  for (let i = 0; i < period - 1; i++) {
    result.push(data[i]);
  }

  // Add initial EMA
  result.push(initialEMA);

  // Calculate subsequent EMA values
  for (let i = period; i < data.length; i++) {
    const ema = (data[i] - result[i - 1]) * multiplier + result[i - 1];
    result.push(ema);
  }

  return result;
}

/**
 * Calculate Weighted Moving Average (WMA)
 * @param data - Array of numbers (e.g., closing prices)
 * @param period - Number of periods for the moving average
 * @returns Array of WMA values
 */
export function calculateWMA(data: readonly number[], period: number): number[] {
  // Validate input
  validateData(data);

  if (data.length < period) {
    return [];
  }

  if (period === 1) {
    return [...data];
  }

  const result: number[] = [];
  const denominator = (period * (period + 1)) / 2; // Sum of weights

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      const weight = period - j;
      sum += data[i - j] * weight;
    }
    result.push(sum / denominator);
  }

  return result;
}

/**
 * Moving Average Indicator class
 * Implements the Indicator interface for consistent usage
 */
export class MovingAverage implements Indicator {
  readonly name: string;

  constructor(
    private readonly type: MovingAverageType,
    private readonly period: number
  ) {
    if (period <= 0) {
      throw new Error('Period must be positive');
    }

    this.name = `${this.getTypeAbbreviation()}(${period})`;
  }

  /**
   * Calculate moving average for given data
   */
  calculate(data: readonly number[]): number | number[] | undefined {
    switch (this.type) {
      case MovingAverageType.SIMPLE:
        return calculateSMA(data, this.period);

      case MovingAverageType.EXPONENTIAL:
        return calculateEMA(data, this.period);

      case MovingAverageType.WEIGHTED:
        return calculateWMA(data, this.period);

      default:
        throw new Error(`Unsupported moving average type: ${this.type}`);
    }
  }

  /**
   * Get type abbreviation for name
   */
  private getTypeAbbreviation(): string {
    switch (this.type) {
      case MovingAverageType.SIMPLE:
        return 'SMA';
      case MovingAverageType.EXPONENTIAL:
        return 'EMA';
      case MovingAverageType.WEIGHTED:
        return 'WMA';
      default:
        return 'MA';
    }
  }
}

/**
 * Validate input data
 */
function validateData(data: readonly number[]): void {
  for (const value of data) {
    if (!isFinite(value)) {
      throw new Error('Data contains invalid values (NaN or Infinity)');
    }
  }
}
