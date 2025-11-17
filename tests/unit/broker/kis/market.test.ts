/**
 * KIS Market Data API Tests
 * TDD RED Phase: Writing tests before implementation
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import axios from 'axios';
import { KISMarketAPI } from '@/broker/kis/market';
import type { KISAuth } from '@/broker/kis/auth';
import type { Symbol, Price, MarketBar } from '@/types';

// Mock axios module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock isAxiosError
const mockIsAxiosError = jest.fn();
(axios as any).isAxiosError = mockIsAxiosError;

describe('KISMarketAPI', () => {
  let marketAPI: KISMarketAPI;
  let mockAuth: jest.Mocked<KISAuth>;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock KISAuth
    mockAuth = {
      getAccessToken: jest.fn(),
      getAuthHeaders: jest.fn(),
      isTokenValid: jest.fn(),
      refreshToken: jest.fn(),
      clearToken: jest.fn(),
    } as unknown as jest.Mocked<KISAuth>;

    mockAuth.getAuthHeaders.mockReturnValue({
      authorization: 'Bearer mock-token',
      appkey: 'mock-app-key',
      appsecret: 'mock-app-secret',
    });

    // Mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn((handler) => handler),
        },
        response: {
          use: jest.fn(),
        },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    marketAPI = new KISMarketAPI(mockAuth, 'https://mock-api.com');
  });

  describe('getPrice', () => {
    it('should fetch current price for a symbol', async () => {
      // Arrange
      const symbol: Symbol = '005930'; // Samsung Electronics
      const mockResponse = {
        output: {
          stck_prpr: '70000', // Current price
          prdy_ctrt: '1.5', // Change rate
          acml_vol: '10000000', // Volume
          stck_hgpr: '71000', // High
          stck_lwpr: '69000', // Low
        },
      };

      // Mock axios response
      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      // Act
      const price: Price = await marketAPI.getPrice(symbol);

      // Assert
      expect(price).toBeDefined();
      expect(price.symbol).toBe(symbol);
      expect(price.price).toBe(70000);
      expect(price.source).toBe('KIS_REST');
      expect(price.timestamp).toBeDefined();
    });

    it('should throw error when API request fails', async () => {
      // Arrange
      const symbol: Symbol = '005930';
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(marketAPI.getPrice(symbol)).rejects.toThrow('Failed to fetch price');
    });

    it('should handle invalid symbol gracefully', async () => {
      // Arrange
      const invalidSymbol: Symbol = 'INVALID';
      mockAxiosInstance.get.mockRejectedValue(new Error('Invalid symbol'));

      // Act & Assert
      await expect(marketAPI.getPrice(invalidSymbol)).rejects.toThrow();
    });
  });

  describe('getPrices', () => {
    it('should fetch multiple prices at once', async () => {
      // Arrange
      const symbols: readonly Symbol[] = ['005930', '000660', '035420'];

      // Mock responses for each symbol
      mockAxiosInstance.get
        .mockResolvedValueOnce({ data: { output: { stck_prpr: '70000' } } })
        .mockResolvedValueOnce({ data: { output: { stck_prpr: '50000' } } })
        .mockResolvedValueOnce({ data: { output: { stck_prpr: '30000' } } });

      // Act
      const prices = await marketAPI.getPrices(symbols);

      // Assert
      expect(prices).toHaveLength(3);
      expect(prices[0].symbol).toBe('005930');
      expect(prices[1].symbol).toBe('000660');
      expect(prices[2].symbol).toBe('035420');
    });

    it('should return empty array for empty input', async () => {
      // Arrange
      const symbols: readonly Symbol[] = [];

      // Act
      const prices = await marketAPI.getPrices(symbols);

      // Assert
      expect(prices).toEqual([]);
    });
  });

  describe('getHistoricalBars', () => {
    it('should fetch historical OHLCV data', async () => {
      // Arrange
      const symbol: Symbol = '005930';
      const startDate = '20240101';
      const endDate = '20240131';
      const interval = 'D'; // Daily

      const mockResponse = {
        output2: [
          {
            stck_bsop_date: '20240102',
            stck_oprc: '70000',
            stck_hgpr: '71000',
            stck_lwpr: '69000',
            stck_clpr: '70500',
            acml_vol: '10000000',
          },
          {
            stck_bsop_date: '20240103',
            stck_oprc: '70500',
            stck_hgpr: '72000',
            stck_lwpr: '70000',
            stck_clpr: '71500',
            acml_vol: '12000000',
          },
        ],
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      // Act
      const bars: readonly MarketBar[] = await marketAPI.getHistoricalBars(
        symbol,
        startDate,
        endDate,
        interval
      );

      // Assert
      expect(bars).toHaveLength(2);
      expect(bars[0].symbol).toBe(symbol);
      expect(bars[0].open).toBe(70000);
      expect(bars[0].high).toBe(71000);
      expect(bars[0].low).toBe(69000);
      expect(bars[0].close).toBe(70500);
      expect(bars[0].volume).toBe(10000000);
      expect(bars[0].source).toBe('KIS_REST');
    });

    it('should validate date range', async () => {
      // Arrange
      const symbol: Symbol = '005930';
      const startDate = '20240201'; // Start after end
      const endDate = '20240101';
      const interval = 'D';

      // Act & Assert
      await expect(
        marketAPI.getHistoricalBars(symbol, startDate, endDate, interval)
      ).rejects.toThrow('Invalid date range');
    });

    it('should support different intervals (1m, 5m, 1h, D, W, M)', async () => {
      // Arrange
      const symbol: Symbol = '005930';
      const startDate = '20240101';
      const endDate = '20240131';

      // Mock response for each interval
      mockAxiosInstance.get.mockResolvedValue({ data: { output2: [] } });

      // Act & Assert
      for (const interval of ['1m', '5m', '1h', 'D', 'W', 'M']) {
        const bars = await marketAPI.getHistoricalBars(
          symbol,
          startDate,
          endDate,
          interval
        );
        expect(Array.isArray(bars)).toBe(true);
      }
    });
  });

  describe('getOrderBook', () => {
    it('should fetch current order book (bid/ask levels)', async () => {
      // Arrange
      const symbol: Symbol = '005930';

      const mockResponse = {
        output1: {
          // Bid (매수호가)
          bidp1: '70000',
          bidp_rsqn1: '1000',
          bidp2: '69900',
          bidp_rsqn2: '2000',
          // Ask (매도호가)
          askp1: '70100',
          askp_rsqn1: '1500',
          askp2: '70200',
          askp_rsqn2: '2500',
        },
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      // Act
      const orderBook = await marketAPI.getOrderBook(symbol);

      // Assert
      expect(orderBook).toBeDefined();
      expect(orderBook.symbol).toBe(symbol);
      expect(orderBook.bids.length).toBeGreaterThan(0);
      expect(orderBook.asks.length).toBeGreaterThan(0);
      expect(orderBook.bids[0].price).toBe(70000);
      expect(orderBook.bids[0].volume).toBe(1000);
      expect(orderBook.asks[0].price).toBe(70100);
      expect(orderBook.asks[0].volume).toBe(1500);
    });

    it('should handle empty order book', async () => {
      // Arrange
      const symbol: Symbol = '005930';
      const mockResponse = { output1: {} };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      // Act
      const orderBook = await marketAPI.getOrderBook(symbol);

      // Assert
      expect(orderBook.bids).toEqual([]);
      expect(orderBook.asks).toEqual([]);
    });
  });

  describe('searchSymbol', () => {
    it('should search symbols by keyword', async () => {
      // Arrange
      const keyword = '삼성';

      const mockResponse = {
        output: [
          {
            pdno: '005930',
            prdt_name: '삼성전자',
            std_pdno: '005930',
          },
          {
            pdno: '005935',
            prdt_name: '삼성전자우',
            std_pdno: '005935',
          },
        ],
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      // Act
      const symbols = await marketAPI.searchSymbol(keyword);

      // Assert
      expect(symbols).toHaveLength(2);
      expect(symbols[0].symbol).toBe('005930');
      expect(symbols[0].name).toBe('삼성전자');
    });

    it('should return empty array when no results found', async () => {
      // Arrange
      const keyword = 'NonExistentCompany123';
      const mockResponse = { output: [] };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      // Act
      const symbols = await marketAPI.searchSymbol(keyword);

      // Assert
      expect(symbols).toEqual([]);
    });
  });

  describe('rate limiting', () => {
    it('should handle multiple concurrent requests', async () => {
      // Arrange
      const symbol: Symbol = '005930';
      const requests = Array(10).fill(null);

      // Mock successful responses
      mockAxiosInstance.get.mockResolvedValue({
        data: { output: { stck_prpr: '70000' } },
      });

      // Act
      const prices = await Promise.all(requests.map(() => marketAPI.getPrice(symbol)));

      // Assert - All requests should succeed
      expect(prices).toHaveLength(10);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(10);

      // Note: Rate limiting logic can be added in future iterations
      // This test verifies that multiple requests are handled correctly
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts', async () => {
      // Arrange
      const symbol: Symbol = '005930';
      mockAxiosInstance.get.mockRejectedValue(new Error('ETIMEDOUT'));

      // Act & Assert
      await expect(marketAPI.getPrice(symbol)).rejects.toThrow();
    });

    it('should handle 429 Too Many Requests', async () => {
      // Arrange
      const symbol: Symbol = '005930';
      const error: any = new Error('Too Many Requests');
      error.response = { status: 429, data: { msg: 'Rate limit exceeded' } };
      error.isAxiosError = true;

      mockIsAxiosError.mockReturnValue(true);
      mockAxiosInstance.get.mockRejectedValue(error);

      // Act & Assert
      await expect(marketAPI.getPrice(symbol)).rejects.toThrow('Rate limit');
    });

    it('should handle 401 Unauthorized (token expired)', async () => {
      // Arrange
      const symbol: Symbol = '005930';
      const error: any = new Error('Unauthorized');
      error.response = { status: 401, data: { msg: 'Token expired' } };
      error.isAxiosError = true;

      mockIsAxiosError.mockReturnValue(true);
      mockAxiosInstance.get.mockRejectedValue(error);

      // Act & Assert
      await expect(marketAPI.getPrice(symbol)).rejects.toThrow();
    });
  });
});
