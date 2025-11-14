/**
 * Unit tests for Redis client (TDD Red)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { RedisClient } from '@/db/redis';
import type { EnvConfig } from '@/config';

describe('RedisClient', () => {
  let client: RedisClient;
  let mockConfig: EnvConfig['redis'];

  beforeEach(() => {
    mockConfig = {
      host: 'localhost',
      port: 6379,
      password: 'test_password',
      db: 0,
    };
  });

  afterEach(async () => {
    if (client) {
      await client.disconnect();
    }
  });

  describe('constructor', () => {
    it('should create RedisClient instance', () => {
      client = new RedisClient(mockConfig);

      expect(client).toBeInstanceOf(RedisClient);
      expect(client).toHaveProperty('connect');
      expect(client).toHaveProperty('disconnect');
      expect(client).toHaveProperty('get');
      expect(client).toHaveProperty('set');
      expect(client).toHaveProperty('del');
    });
  });

  describe('connect', () => {
    it('should establish connection to Redis', async () => {
      client = new RedisClient(mockConfig);

      await expect(client.connect()).resolves.not.toThrow();
    });

    it('should not throw if already connected', async () => {
      client = new RedisClient(mockConfig);

      await client.connect();
      await expect(client.connect()).resolves.not.toThrow();
    });
  });

  describe('disconnect', () => {
    it('should close Redis connection', async () => {
      client = new RedisClient(mockConfig);
      await client.connect();

      await expect(client.disconnect()).resolves.not.toThrow();
    });

    it('should not throw if not connected', async () => {
      client = new RedisClient(mockConfig);

      await expect(client.disconnect()).resolves.not.toThrow();
    });
  });

  describe('get', () => {
    it('should retrieve value by key', async () => {
      client = new RedisClient(mockConfig);
      await client.connect();

      const value = await client.get('test-key');

      expect(value).toBeDefined();
    });

    it('should return null for non-existent key', async () => {
      client = new RedisClient(mockConfig);
      await client.connect();

      const value = await client.get('non-existent-key');

      expect(value).toBeNull();
    });

    it('should throw error if not connected', async () => {
      client = new RedisClient(mockConfig);

      await expect(client.get('test-key')).rejects.toThrow();
    });
  });

  describe('set', () => {
    it('should set value for key', async () => {
      client = new RedisClient(mockConfig);
      await client.connect();

      await expect(client.set('test-key', 'test-value')).resolves.not.toThrow();
    });

    it('should set value with TTL', async () => {
      client = new RedisClient(mockConfig);
      await client.connect();

      await expect(client.set('test-key', 'test-value', 60)).resolves.not.toThrow();
    });

    it('should throw error if not connected', async () => {
      client = new RedisClient(mockConfig);

      await expect(client.set('test-key', 'test-value')).rejects.toThrow();
    });
  });

  describe('del', () => {
    it('should delete key', async () => {
      client = new RedisClient(mockConfig);
      await client.connect();

      const result = await client.del('test-key');

      expect(typeof result).toBe('number');
    });

    it('should throw error if not connected', async () => {
      client = new RedisClient(mockConfig);

      await expect(client.del('test-key')).rejects.toThrow();
    });
  });

  describe('exists', () => {
    it('should check if key exists', async () => {
      client = new RedisClient(mockConfig);
      await client.connect();

      const exists = await client.exists('test-key');

      expect(typeof exists).toBe('boolean');
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      client = new RedisClient(mockConfig);

      expect(client.isConnected()).toBe(false);
    });

    it('should return true when connected', async () => {
      client = new RedisClient(mockConfig);
      await client.connect();

      expect(client.isConnected()).toBe(true);
    });

    it('should return false after disconnect', async () => {
      client = new RedisClient(mockConfig);
      await client.connect();
      await client.disconnect();

      expect(client.isConnected()).toBe(false);
    });
  });
});
