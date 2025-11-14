/**
 * Korea Investment & Securities (KIS) Market Data API
 * Provides real-time and historical market data
 */

import axios, { type AxiosInstance, isAxiosError } from 'axios';
import type { KISAuth } from './auth';
import type { Symbol, Price, MarketBar, OrderBook, SymbolInfo } from '@/types';
import { MarketDataSource } from '@/types';

/**
 * KIS Market Data API Client
 */
export class KISMarketAPI {
  private httpClient: AxiosInstance;

  constructor(
    private readonly auth: KISAuth,
    private readonly baseUrl: string
  ) {
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to inject auth headers
    this.httpClient.interceptors.request.use(async (config) => {
      const authHeaders = this.auth.getAuthHeaders();
      config.headers = {
        ...config.headers,
        ...authHeaders,
      };
      return config;
    });
  }

  /**
   * Get current price for a symbol
   */
  async getPrice(symbol: Symbol): Promise<Price> {
    try {
      const response = await this.httpClient.get('/uapi/domestic-stock/v1/quotations/inquire-price', {
        params: {
          FID_COND_MRKT_DIV_CODE: 'J',
          FID_INPUT_ISCD: symbol,
        },
      });

      const output = response.data.output;

      if (!output || !output.stck_prpr) {
        throw new Error(`Invalid price data for symbol ${symbol}`);
      }

      return {
        symbol,
        price: parseInt(output.stck_prpr, 10),
        timestamp: new Date().toISOString(),
        source: MarketDataSource.KIS_REST,
      };
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(
          `Failed to fetch price for ${symbol}: ${error.response?.data?.msg || error.message}`
        );
      }
      throw new Error(`Failed to fetch price for ${symbol}: ${(error as Error).message}`);
    }
  }

  /**
   * Get multiple prices at once
   */
  async getPrices(symbols: readonly Symbol[]): Promise<readonly Price[]> {
    if (symbols.length === 0) {
      return [];
    }

    // Fetch prices sequentially to respect rate limits
    const prices: Price[] = [];
    for (const symbol of symbols) {
      try {
        const price = await this.getPrice(symbol);
        prices.push(price);
      } catch (error) {
        // Log error but continue with other symbols
        console.error(`Failed to fetch price for ${symbol}:`, error);
      }
    }

    return prices;
  }

  /**
   * Get historical OHLCV bars
   */
  async getHistoricalBars(
    symbol: Symbol,
    startDate: string,
    endDate: string,
    interval: string
  ): Promise<readonly MarketBar[]> {
    // Validate date range
    if (startDate > endDate) {
      throw new Error('Invalid date range: start date must be before or equal to end date');
    }

    try {
      const response = await this.httpClient.get(
        '/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice',
        {
          params: {
            FID_COND_MRKT_DIV_CODE: 'J',
            FID_INPUT_ISCD: symbol,
            FID_INPUT_DATE_1: startDate,
            FID_INPUT_DATE_2: endDate,
            FID_PERIOD_DIV_CODE: this.mapIntervalToCode(interval),
            FID_ORG_ADJ_PRC: '0', // 0: Original price, 1: Adjusted price
          },
        }
      );

      const output = response.data.output2 || [];

      return output.map((bar: any, index: number) => ({
        barId: `${symbol}-${bar.stck_bsop_date}-${index}`,
        timestamp: this.parseKISDate(bar.stck_bsop_date),
        symbol,
        open: parseInt(bar.stck_oprc, 10),
        high: parseInt(bar.stck_hgpr, 10),
        low: parseInt(bar.stck_lwpr, 10),
        close: parseInt(bar.stck_clpr, 10),
        volume: parseInt(bar.acml_vol, 10),
        source: MarketDataSource.KIS_REST,
      }));
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(
          `Failed to fetch historical bars for ${symbol}: ${error.response?.data?.msg || error.message}`
        );
      }
      throw new Error(`Failed to fetch historical bars for ${symbol}: ${(error as Error).message}`);
    }
  }

  /**
   * Get current order book (bid/ask levels)
   */
  async getOrderBook(symbol: Symbol): Promise<OrderBook> {
    try {
      const response = await this.httpClient.get(
        '/uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn',
        {
          params: {
            FID_COND_MRKT_DIV_CODE: 'J',
            FID_INPUT_ISCD: symbol,
          },
        }
      );

      const output = response.data.output1 || {};

      // Parse bid levels (매수호가)
      const bids = [];
      for (let i = 1; i <= 10; i++) {
        const price = output[`bidp${i}`];
        const volume = output[`bidp_rsqn${i}`];
        if (price && volume) {
          bids.push({
            price: parseInt(price, 10),
            volume: parseInt(volume, 10),
          });
        }
      }

      // Parse ask levels (매도호가)
      const asks = [];
      for (let i = 1; i <= 10; i++) {
        const price = output[`askp${i}`];
        const volume = output[`askp_rsqn${i}`];
        if (price && volume) {
          asks.push({
            price: parseInt(price, 10),
            volume: parseInt(volume, 10),
          });
        }
      }

      return {
        symbol,
        timestamp: new Date().toISOString(),
        bids,
        asks,
      };
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(
          `Failed to fetch order book for ${symbol}: ${error.response?.data?.msg || error.message}`
        );
      }
      throw new Error(`Failed to fetch order book for ${symbol}: ${(error as Error).message}`);
    }
  }

  /**
   * Search symbols by keyword
   */
  async searchSymbol(keyword: string): Promise<readonly SymbolInfo[]> {
    try {
      const response = await this.httpClient.get(
        '/uapi/domestic-stock/v1/quotations/search-stock-info',
        {
          params: {
            PRDT_TYPE_CD: '300', // 주식
            PDNO: keyword,
          },
        }
      );

      const output = response.data.output || [];

      return output.map((item: any) => ({
        symbolId: item.std_pdno || item.pdno,
        symbol: item.pdno,
        name: item.prdt_name,
        market: 'KOSPI', // TODO: Parse from response
        status: 'ACTIVE' as const,
      }));
    } catch (error) {
      if (isAxiosError(error)) {
        throw new Error(
          `Failed to search symbol with keyword "${keyword}": ${error.response?.data?.msg || error.message}`
        );
      }
      throw new Error(
        `Failed to search symbol with keyword "${keyword}": ${(error as Error).message}`
      );
    }
  }

  /**
   * Map interval string to KIS period code
   */
  private mapIntervalToCode(interval: string): string {
    const mapping: Record<string, string> = {
      '1m': '1', // 1 minute (not supported by daily API)
      '5m': '5', // 5 minutes
      '1h': '60', // 1 hour
      D: 'D', // Daily
      W: 'W', // Weekly
      M: 'M', // Monthly
    };

    return mapping[interval] || 'D';
  }

  /**
   * Parse KIS date format (YYYYMMDD) to ISO string
   */
  private parseKISDate(dateStr: string): string {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return new Date(`${year}-${month}-${day}`).toISOString();
  }
}
