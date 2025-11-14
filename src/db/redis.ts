/**
 * Redis client implementation
 */

import { createClient, type RedisClientType } from 'redis';
import type { EnvConfig } from '@/config';

/**
 * Redis client for caching operations
 */
export class RedisClient {
  private client: RedisClientType | null = null;
  private connected = false;

  constructor(private readonly config: EnvConfig['redis']) {}

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    const url = this.config.password
      ? `redis://:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.db}`
      : `redis://${this.config.host}:${this.config.port}/${this.config.db}`;

    this.client = createClient({ url });

    this.client.on('error', (error: Error) => {
      console.error('Redis Client Error:', error);
    });

    try {
      await this.client.connect();
      this.connected = true;
    } catch (error) {
      this.client = null;
      throw new Error(`Failed to connect to Redis: ${(error as Error).message}`);
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.quit();
      this.client = null;
      this.connected = false;
    } catch (error) {
      throw new Error(`Failed to disconnect from Redis: ${(error as Error).message}`);
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    if (!this.client) {
      throw new Error('Not connected to Redis. Call connect() first.');
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      throw new Error(`Failed to get key "${key}": ${(error as Error).message}`);
    }
  }

  /**
   * Set value for key with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) {
      throw new Error('Not connected to Redis. Call connect() first.');
    }

    try {
      if (ttlSeconds !== undefined) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      throw new Error(`Failed to set key "${key}": ${(error as Error).message}`);
    }
  }

  /**
   * Delete key
   */
  async del(key: string): Promise<number> {
    if (!this.client) {
      throw new Error('Not connected to Redis. Call connect() first.');
    }

    try {
      return await this.client.del(key);
    } catch (error) {
      throw new Error(`Failed to delete key "${key}": ${(error as Error).message}`);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('Not connected to Redis. Call connect() first.');
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      throw new Error(`Failed to check existence of key "${key}": ${(error as Error).message}`);
    }
  }

  /**
   * Set value with JSON serialization
   */
  async setJSON(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  /**
   * Get value with JSON deserialization
   */
  async getJSON<T = unknown>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (value === null) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON for key "${key}": ${(error as Error).message}`);
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  /**
   * Get Redis client instance (for advanced use cases)
   */
  getClient(): RedisClientType | null {
    return this.client;
  }
}
