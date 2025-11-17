/**
 * Daily Loss Limit Rule
 * Prevents trading when daily loss exceeds the configured limit
 */

import type { RiskRule, RiskDecision, RiskContext } from '@/types';

/**
 * Daily Loss Limit Rule configuration
 */
export interface DailyLossLimitConfig {
  readonly maxDailyLossPercent: number; // Negative percentage (e.g., -0.02 for -2%)
}

/**
 * Daily Loss Limit Rule implementation
 * Checks if daily loss exceeds the configured limit
 */
export class DailyLossLimitRule implements RiskRule {
  readonly ruleId: string;
  readonly name: string = 'Daily Loss Limit';
  readonly description: string = 'Prevents trading when daily loss exceeds the configured limit';

  constructor(private readonly config: DailyLossLimitConfig) {
    this.ruleId = `daily-loss-limit-${Date.now()}`;

    // Validate configuration
    if (config.maxDailyLossPercent >= 0) {
      throw new Error('Daily loss limit must be negative');
    }
  }

  /**
   * Check if trading is allowed based on daily loss
   */
  async check(context: RiskContext): Promise<RiskDecision> {
    const { dailyPnL, balance, timestamp } = context;

    // Calculate daily loss percentage
    const dailyLossPercent = balance.totalEquity > 0 ? dailyPnL / balance.totalEquity : 0;

    // Check if daily PnL is positive (profit)
    if (dailyPnL >= 0) {
      return {
        approved: true,
        reason: `Daily profit (+${dailyPnL.toLocaleString()} KRW). Trading allowed.`,
        ruleId: this.ruleId,
        timestamp,
        metadata: {
          dailyPnL,
          dailyLossPercent,
          limit: this.config.maxDailyLossPercent,
        },
      };
    }

    // Check if daily loss is within limit
    if (dailyLossPercent >= this.config.maxDailyLossPercent) {
      return {
        approved: true,
        reason: `Daily loss (${(dailyLossPercent * 100).toFixed(2)}%) is within limit (${(this.config.maxDailyLossPercent * 100).toFixed(2)}%). Trading allowed.`,
        ruleId: this.ruleId,
        timestamp,
        metadata: {
          dailyPnL,
          dailyLossPercent,
          limit: this.config.maxDailyLossPercent,
        },
      };
    }

    // Daily loss exceeded limit
    return {
      approved: false,
      reason: `Daily loss (${(dailyLossPercent * 100).toFixed(2)}%) exceeded limit (${(this.config.maxDailyLossPercent * 100).toFixed(2)}%). Trading blocked.`,
      ruleId: this.ruleId,
      timestamp,
      metadata: {
        dailyPnL,
        dailyLossPercent,
        limit: this.config.maxDailyLossPercent,
        excessLoss: dailyLossPercent - this.config.maxDailyLossPercent,
      },
    };
  }
}
