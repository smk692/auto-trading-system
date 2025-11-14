/**
 * Korea Investment & Securities (KIS) Authentication
 */

import axios, { type AxiosInstance } from 'axios';
import type { AuthCredentials, AccessToken } from '@/types';

/**
 * KIS Authentication Manager
 */
export class KISAuth {
  private httpClient: AxiosInstance;
  private currentToken: AccessToken | null = null;

  constructor(
    private readonly credentials: AuthCredentials,
    private readonly baseUrl: string
  ) {
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });
  }

  /**
   * Get access token (cached if still valid)
   */
  async getAccessToken(): Promise<AccessToken> {
    if (this.isTokenValid()) {
      return this.currentToken!;
    }

    return await this.refreshToken();
  }

  /**
   * Obtain new access token from KIS API
   */
  async refreshToken(): Promise<AccessToken> {
    try {
      const response = await this.httpClient.post<{
        access_token: string;
        token_type: string;
        expires_in: number;
      }>('/oauth2/tokenP', {
        grant_type: 'client_credentials',
        appkey: this.credentials.appKey,
        appsecret: this.credentials.appSecret,
      });

      const { access_token, expires_in } = response.data;

      // Calculate expiration time (with 5-minute buffer for safety)
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expires_in - 300);

      this.currentToken = {
        token: access_token,
        expiresAt: expiresAt.toISOString(),
      };

      return this.currentToken;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to obtain access token: ${error.response?.data?.msg || error.message}`
        );
      }
      throw new Error(`Failed to obtain access token: ${(error as Error).message}`);
    }
  }

  /**
   * Check if current token is valid
   */
  isTokenValid(): boolean {
    if (this.currentToken === null) {
      return false;
    }

    const expiresAt = new Date(this.currentToken.expiresAt);
    const now = new Date();

    return expiresAt > now;
  }

  /**
   * Get authorization headers for API requests
   */
  getAuthHeaders(): Record<string, string> {
    if (!this.isTokenValid() || this.currentToken === null) {
      throw new Error('No valid access token available. Call getAccessToken() first.');
    }

    return {
      authorization: `Bearer ${this.currentToken.token}`,
      appkey: this.credentials.appKey,
      appsecret: this.credentials.appSecret,
    };
  }

  /**
   * Clear cached token (force refresh on next request)
   */
  clearToken(): void {
    this.currentToken = null;
  }
}
