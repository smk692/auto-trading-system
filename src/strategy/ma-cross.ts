/**
 * MA Cross Strategy
 * Simple Moving Average Crossover Strategy
 * Generates BUY when short MA crosses above long MA
 * Generates SELL when short MA crosses below long MA
 */

import crypto from 'crypto';
import type { Strategy, Signal, StrategyParams, MarketData } from '@/types';
import { MovingAverage } from './indicators/ma';
import { MovingAverageType } from '@/types';

/**
 * MA Cross Strategy Parameters
 */
export interface MACrossParams extends StrategyParams {
  readonly shortPeriod: number;
  readonly longPeriod: number;
  readonly maType: MovingAverageType;
  readonly volumeThreshold?: number;
}

/**
 * MA Cross Strategy Implementation
 */
export class MACrossStrategy implements Strategy {
  readonly strategyId: string;
  readonly name: string = 'MA Cross Strategy';
  readonly description: string = 'Moving Average Crossover strategy - generates signals when short MA crosses long MA';
  readonly params: MACrossParams;

  private readonly shortMA: MovingAverage;
  private readonly longMA: MovingAverage;

  constructor(params: MACrossParams) {
    this.params = params;
    this.strategyId = `ma-cross-${params.shortPeriod}-${params.longPeriod}-${Date.now()}`;

    // Validate parameters
    if (!this.validateParams()) {
      throw new Error('Invalid strategy parameters');
    }

    // Initialize moving averages
    this.shortMA = new MovingAverage(params.maType, params.shortPeriod);
    this.longMA = new MovingAverage(params.maType, params.longPeriod);
  }

  /**
   * Analyze market data and generate signal
   */
  async analyze(marketData: MarketData): Promise<Signal> {
    // Validate sufficient data
    if (!marketData.bars || marketData.bars.length < this.params.longPeriod) {
      throw new Error(
        `Insufficient data: need at least ${this.params.longPeriod} bars, got ${marketData.bars?.length || 0}`
      );
    }

    // Extract closing prices
    const closePrices = marketData.bars.map((bar) => bar.close);

    // Calculate moving averages
    const shortMAValues = this.shortMA.calculate(closePrices) as number[];
    const longMAValues = this.longMA.calculate(closePrices) as number[];

    // Ensure we have at least 2 longMA values for crossover detection
    if (longMAValues.length < 2) {
      throw new Error(
        `Insufficient data for crossover detection: need at least ${this.params.longPeriod + 1} bars`
      );
    }

    // Get current and previous values for the same time period
    // Since longMA starts later, we need to align the indices
    const offset = shortMAValues.length - longMAValues.length;
    const currentShortMA = shortMAValues[shortMAValues.length - 1];
    const currentLongMA = longMAValues[longMAValues.length - 1];
    const previousShortMA = shortMAValues[shortMAValues.length - 2];
    const previousLongMA = longMAValues[longMAValues.length - 2];

    // Determine crossover
    const bullishCross = previousShortMA <= previousLongMA && currentShortMA > currentLongMA;
    const bearishCross = previousShortMA >= previousLongMA && currentShortMA < currentLongMA;

    // Calculate volume (current bar)
    const currentVolume = marketData.bars[marketData.bars.length - 1].volume;

    // Check volume threshold
    const volumeThreshold = this.params.volumeThreshold || 0;
    const hasVolumeConfirmation = currentVolume >= volumeThreshold;

    // Generate signal
    let direction: 'BUY' | 'SELL' | 'HOLD';
    let strength: number;
    let reason: string;

    if (bullishCross && hasVolumeConfirmation) {
      direction = 'BUY';
      // Calculate strength based on MA spread and volume
      const maSpread = ((currentShortMA - currentLongMA) / currentLongMA) * 100;
      const volumeBoost = this.params.volumeThreshold
        ? Math.min(currentVolume / this.params.volumeThreshold, 1.5)
        : 1.0;
      strength = Math.min(0.6 + Math.abs(maSpread) * 0.01 * volumeBoost, 0.95);
      reason = `Short MA (${this.shortMA.name}=${currentShortMA.toFixed(2)}) crossed above Long MA (${this.longMA.name}=${currentLongMA.toFixed(2)}) with volume ${currentVolume.toLocaleString()}`;
    } else if (bearishCross && hasVolumeConfirmation) {
      direction = 'SELL';
      // Calculate strength based on MA spread and volume
      const maSpread = ((currentLongMA - currentShortMA) / currentLongMA) * 100;
      const volumeBoost = this.params.volumeThreshold
        ? Math.min(currentVolume / this.params.volumeThreshold, 1.5)
        : 1.0;
      strength = Math.min(0.6 + Math.abs(maSpread) * 0.01 * volumeBoost, 0.95);
      reason = `Short MA (${this.shortMA.name}=${currentShortMA.toFixed(2)}) crossed below Long MA (${this.longMA.name}=${currentLongMA.toFixed(2)}) with volume ${currentVolume.toLocaleString()}`;
    } else if (!hasVolumeConfirmation && (bullishCross || bearishCross)) {
      direction = 'HOLD';
      strength = 0.3;
      reason = `MA crossover detected but volume (${currentVolume.toLocaleString()}) below threshold (${volumeThreshold.toLocaleString()})`;
    } else {
      direction = 'HOLD';
      strength = 0.2;
      reason = `No clear crossover. Short MA=${currentShortMA.toFixed(2)}, Long MA=${currentLongMA.toFixed(2)}`;
    }

    // Create signal
    const signal: Signal = {
      signalId: `signal-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      strategyId: this.strategyId,
      symbol: marketData.symbol,
      direction,
      strength,
      reason,
      paramsHash: this.getParamsHash(),
      correlationId: this.generateCorrelationId(),
      targetPrice: direction === 'BUY' ? currentShortMA * 1.05 : currentShortMA * 0.95,
      stopLoss: direction === 'BUY' ? currentShortMA * 0.98 : currentShortMA * 1.02,
      metadata: {
        shortMA: currentShortMA,
        longMA: currentLongMA,
        volume: currentVolume,
        bars: marketData.bars.length,
      },
    };

    return signal;
  }

  /**
   * Get hash of strategy parameters
   */
  getParamsHash(): string {
    const paramsString = JSON.stringify(this.params, Object.keys(this.params).sort());
    return crypto.createHash('sha256').update(paramsString).digest('hex');
  }

  /**
   * Validate strategy parameters
   */
  validateParams(): boolean {
    const { shortPeriod, longPeriod, maType } = this.params;

    // Check positive periods
    if (shortPeriod <= 0 || longPeriod <= 0) {
      if (this.strategyId) {
        // Called from constructor - throw error
        throw new Error('Periods must be positive');
      }
      return false;
    }

    // Check short < long
    if (shortPeriod >= longPeriod) {
      if (this.strategyId) {
        // Called from constructor - throw error
        throw new Error('Short period must be less than long period');
      }
      return false;
    }

    // Check valid MA type
    if (!Object.values(MovingAverageType).includes(maType)) {
      return false;
    }

    return true;
  }

  /**
   * Generate unique correlation ID for signal tracking
   */
  private generateCorrelationId(): string {
    return `${this.strategyId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
