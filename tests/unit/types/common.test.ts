/**
 * Unit tests for common types
 */

import { describe, it, expect } from '@jest/globals';
import { TradingError, ErrorCode, Direction, Market, Status } from '@/types/common';

describe('TradingError', () => {
  it('should create error with message and code', () => {
    const error = new TradingError('Test error', ErrorCode.UNKNOWN_ERROR);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TradingError);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(error.name).toBe('TradingError');
  });

  it('should create error with details', () => {
    const details = { orderId: '123', reason: 'test' };
    const error = new TradingError('Test error', ErrorCode.ORDER_REJECTED, details);

    expect(error.details).toEqual(details);
  });

  it('should have correct error code for authentication failure', () => {
    const error = new TradingError('Auth failed', ErrorCode.AUTH_FAILED);

    expect(error.code).toBe(ErrorCode.AUTH_FAILED);
  });
});

describe('Direction', () => {
  it('should have BUY, SELL, and HOLD values', () => {
    expect(Direction.BUY).toBe('BUY');
    expect(Direction.SELL).toBe('SELL');
    expect(Direction.HOLD).toBe('HOLD');
  });
});

describe('Market', () => {
  it('should have KOSPI, KOSDAQ, and KONEX values', () => {
    expect(Market.KOSPI).toBe('KOSPI');
    expect(Market.KOSDAQ).toBe('KOSDAQ');
    expect(Market.KONEX).toBe('KONEX');
  });
});

describe('Status', () => {
  it('should have ACTIVE, INACTIVE, SUSPENDED, and DELETED values', () => {
    expect(Status.ACTIVE).toBe('ACTIVE');
    expect(Status.INACTIVE).toBe('INACTIVE');
    expect(Status.SUSPENDED).toBe('SUSPENDED');
    expect(Status.DELETED).toBe('DELETED');
  });
});
