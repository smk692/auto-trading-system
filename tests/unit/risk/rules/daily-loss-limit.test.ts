/**
 * Daily Loss Limit Rule Tests
 * TDD RED Phase: Writing tests before implementation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { DailyLossLimitRule } from '@/risk/rules/daily-loss-limit';
import type { RiskContext } from '@/types';

describe('DailyLossLimitRule', () => {
  let rule: DailyLossLimitRule;

  beforeEach(() => {
    rule = new DailyLossLimitRule({
      maxDailyLossPercent: -0.02, // -2% limit
    });
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(rule.ruleId).toBeDefined();
      expect(rule.name).toBe('Daily Loss Limit');
      expect(rule.description).toContain('daily loss');
    });

    it('should validate limit is negative', () => {
      expect(() => new DailyLossLimitRule({ maxDailyLossPercent: 0.02 })).toThrow(
        'Daily loss limit must be negative'
      );
    });
  });

  describe('check', () => {
    it('should approve when daily loss is within limit', async () => {
      // Arrange
      const context = createRiskContext({
        dailyPnL: -100000, // -100k loss
        balance: { totalEquity: 10000000 }, // 10M balance -> -1% daily loss
      });

      // Act
      const decision = await rule.check(context);

      // Assert
      expect(decision.approved).toBe(true);
      expect(decision.ruleId).toBe(rule.ruleId);
      expect(decision.reason).toContain('within limit');
    });

    it('should reject when daily loss exceeds limit', async () => {
      // Arrange
      const context = createRiskContext({
        dailyPnL: -300000, // -300k loss
        balance: { totalEquity: 10000000 }, // 10M balance -> -3% daily loss
      });

      // Act
      const decision = await rule.check(context);

      // Assert
      expect(decision.approved).toBe(false);
      expect(decision.ruleId).toBe(rule.ruleId);
      expect(decision.reason).toContain('exceeded');
      expect(decision.reason).toContain('-3.00%');
    });

    it('should approve when daily PnL is positive', async () => {
      // Arrange
      const context = createRiskContext({
        dailyPnL: 500000, // +500k profit
        balance: { totalEquity: 10000000 },
      });

      // Act
      const decision = await rule.check(context);

      // Assert
      expect(decision.approved).toBe(true);
      expect(decision.reason).toContain('profit');
    });

    it('should approve when daily PnL is zero', async () => {
      // Arrange
      const context = createRiskContext({
        dailyPnL: 0,
        balance: { totalEquity: 10000000 },
      });

      // Act
      const decision = await rule.check(context);

      // Assert
      expect(decision.approved).toBe(true);
    });

    it('should handle edge case: exactly at limit', async () => {
      // Arrange
      const context = createRiskContext({
        dailyPnL: -200000, // -200k loss
        balance: { totalEquity: 10000000 }, // Exactly -2%
      });

      // Act
      const decision = await rule.check(context);

      // Assert
      expect(decision.approved).toBe(true); // At limit is OK
    });

    it('should handle very small balances', async () => {
      // Arrange
      const context = createRiskContext({
        dailyPnL: -1000,
        balance: { totalEquity: 10000 }, // -10% loss
      });

      // Act
      const decision = await rule.check(context);

      // Assert
      expect(decision.approved).toBe(false);
    });

    it('should include metadata in decision', async () => {
      // Arrange
      const context = createRiskContext({
        dailyPnL: -100000,
        balance: { totalEquity: 10000000 },
      });

      // Act
      const decision = await rule.check(context);

      // Assert
      expect(decision.metadata).toBeDefined();
      expect(decision.metadata?.dailyPnL).toBe(-100000);
      expect(decision.metadata?.dailyLossPercent).toBeCloseTo(-0.01, 4);
      expect(decision.metadata?.limit).toBe(-0.02);
    });
  });
});

// Helper function
function createRiskContext(overrides: {
  dailyPnL?: number;
  balance?: { totalEquity: number };
}): RiskContext {
  return {
    signal: {
      signalId: 'sig-1',
      timestamp: new Date().toISOString(),
      strategyId: 'strat-1',
      symbol: '005930',
      direction: 'BUY',
      strength: 0.8,
      reason: 'Test signal',
      paramsHash: 'hash123',
      correlationId: 'corr-1',
    },
    currentPositions: [],
    balance: {
      accountNo: 'test-account',
      totalAssets: overrides.balance?.totalEquity || 10000000,
      totalEquity: overrides.balance?.totalEquity || 10000000,
      cash: overrides.balance?.totalEquity || 10000000,
      securities: 0,
      buyingPower: overrides.balance?.totalEquity || 10000000,
      timestamp: new Date().toISOString(),
    },
    dailyPnL: overrides.dailyPnL || 0,
    openOrders: 0,
    timestamp: new Date().toISOString(),
    correlationId: 'corr-test',
  };
}
