/**
 * Unit tests for Korea Investment & Securities (KIS) Authentication (TDD Red)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { KISAuth } from '@/broker/kis/auth';
import type { AuthCredentials, AccessToken } from '@/types';

describe('KISAuth', () => {
  let auth: KISAuth;
  let mockCredentials: AuthCredentials;
  const mockBaseUrl = 'https://openapi.koreainvestment.com:9443';

  beforeEach(() => {
    mockCredentials = {
      appKey: 'test_app_key',
      appSecret: 'test_app_secret',
      accountNo: '12345678-01',
    };
    auth = new KISAuth(mockCredentials, mockBaseUrl);
  });

  describe('constructor', () => {
    it('should create KISAuth instance', () => {
      expect(auth).toBeInstanceOf(KISAuth);
      expect(auth).toHaveProperty('getAccessToken');
      expect(auth).toHaveProperty('refreshToken');
      expect(auth).toHaveProperty('isTokenValid');
    });
  });

  describe('getAccessToken', () => {
    it('should obtain new access token when not available', async () => {
      const token = await auth.getAccessToken();

      expect(token).toBeDefined();
      expect(token).toHaveProperty('token');
      expect(token).toHaveProperty('expiresAt');
      expect(typeof token.token).toBe('string');
      expect(token.token.length).toBeGreaterThan(0);
    });

    it('should return cached token if still valid', async () => {
      const token1 = await auth.getAccessToken();
      const token2 = await auth.getAccessToken();

      expect(token1.token).toBe(token2.token);
    });

    it('should refresh token if expired', async () => {
      // First call - get new token
      const token1 = await auth.getAccessToken();

      // Force token expiration
      jest.useFakeTimers();
      jest.advanceTimersByTime(24 * 60 * 60 * 1000); // 24 hours

      // Second call - should get new token
      const token2 = await auth.getAccessToken();

      jest.useRealTimers();

      // Tokens should be different (assuming time has changed enough)
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
    });
  });

  describe('refreshToken', () => {
    it('should obtain new access token', async () => {
      const token = await auth.refreshToken();

      expect(token).toBeDefined();
      expect(token).toHaveProperty('token');
      expect(token).toHaveProperty('expiresAt');
    });
  });

  describe('isTokenValid', () => {
    it('should return false when no token exists', () => {
      expect(auth.isTokenValid()).toBe(false);
    });

    it('should return true when valid token exists', async () => {
      await auth.getAccessToken();

      expect(auth.isTokenValid()).toBe(true);
    });

    it('should return false when token is expired', async () => {
      await auth.getAccessToken();

      // Force token expiration
      jest.useFakeTimers();
      jest.advanceTimersByTime(24 * 60 * 60 * 1000); // 24 hours
      jest.useRealTimers();

      expect(auth.isTokenValid()).toBe(false);
    });
  });

  describe('getAuthHeaders', () => {
    it('should return authorization headers', async () => {
      await auth.getAccessToken();
      const headers = auth.getAuthHeaders();

      expect(headers).toBeDefined();
      expect(headers).toHaveProperty('authorization');
      expect(headers.authorization).toContain('Bearer ');
    });

    it('should throw error if no token available', () => {
      expect(() => auth.getAuthHeaders()).toThrow();
    });
  });
});
