/**
 * Risk management types for trading system
 */

import type { Symbol, Timestamp, Percentage, KRW, CorrelationId } from './common';
import type { Position, Balance } from './order';
import type { Signal } from './strategy';

/**
 * Risk decision result
 */
export interface RiskDecision {
  readonly approved: boolean;
  readonly reason: string;
  readonly ruleId: string;
  readonly timestamp: Timestamp;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Risk context for rule evaluation
 */
export interface RiskContext {
  readonly signal: Signal;
  readonly currentPositions: readonly Position[];
  readonly balance: Balance;
  readonly dailyPnL: KRW;
  readonly openOrders: number;
  readonly timestamp: Timestamp;
  readonly correlationId: CorrelationId;
}

/**
 * Risk rule interface
 */
export interface RiskRule {
  readonly ruleId: string;
  readonly name: string;
  readonly description: string;

  /**
   * Evaluate the risk rule
   * @returns RiskDecision indicating approval or rejection
   */
  check(context: RiskContext): Promise<RiskDecision>;
}

/**
 * Risk limits configuration
 */
export interface RiskLimits {
  readonly maxDailyLossPercent: Percentage; // e.g., -0.02 for -2%
  readonly maxPositionCount: number;
  readonly maxPositionWeightPercent: Percentage; // e.g., 0.20 for 20%
  readonly maxConcentrationPercent: Percentage; // Max % in single symbol
  readonly maxOrderSize: KRW;
  readonly maxDrawdownPercent: Percentage;
  readonly minCashReservePercent: Percentage;
}

/**
 * Risk event for logging
 */
export interface RiskEvent {
  readonly eventId: string;
  readonly timestamp: Timestamp;
  readonly ruleId: string;
  readonly decision: RiskDecision;
  readonly context: RiskContext;
  readonly severity: RiskSeverity;
}

/**
 * Risk severity level
 */
export enum RiskSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

/**
 * Kill switch status
 */
export interface KillSwitchStatus {
  readonly active: boolean;
  readonly activatedAt?: Timestamp;
  readonly reason?: string;
  readonly activatedBy?: string;
}

/**
 * Position risk metrics
 */
export interface PositionRisk {
  readonly symbol: Symbol;
  readonly position: Position;
  readonly weight: Percentage; // Position value / Total portfolio value
  readonly unrealizedPnLPercent: Percentage;
  readonly valueAtRisk: KRW; // VaR estimate
  readonly beta?: number; // If market beta available
}

/**
 * Portfolio risk metrics
 */
export interface PortfolioRisk {
  readonly timestamp: Timestamp;
  readonly totalExposure: KRW;
  readonly longExposure: KRW;
  readonly shortExposure: KRW;
  readonly netExposure: KRW;
  readonly grossExposure: KRW;
  readonly concentration: Map<Symbol, Percentage>;
  readonly valueAtRisk: KRW;
  readonly expectedShortfall: KRW;
  readonly positions: readonly PositionRisk[];
}

/**
 * Daily risk summary
 */
export interface DailyRiskSummary {
  readonly date: string; // YYYY-MM-DD
  readonly dailyPnL: KRW;
  readonly dailyReturn: Percentage;
  readonly maxDrawdown: KRW;
  readonly riskEvents: readonly RiskEvent[];
  readonly violatedRules: readonly string[];
  readonly killSwitchActivations: number;
}

/**
 * Risk alert
 */
export interface RiskAlert {
  readonly alertId: string;
  readonly timestamp: Timestamp;
  readonly severity: RiskSeverity;
  readonly message: string;
  readonly ruleId: string;
  readonly action: RiskAlertAction;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Risk alert action
 */
export enum RiskAlertAction {
  NOTIFY = 'NOTIFY',
  WARN = 'WARN',
  BLOCK_TRADING = 'BLOCK_TRADING',
  ACTIVATE_KILL_SWITCH = 'ACTIVATE_KILL_SWITCH',
  REDUCE_POSITIONS = 'REDUCE_POSITIONS',
}
