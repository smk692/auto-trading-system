/**
 * Unit tests for PostgreSQL client (TDD Red)
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PostgresClient } from '@/db/postgres';
import type { EnvConfig } from '@/config';

describe('PostgresClient', () => {
  let client: PostgresClient;
  let mockConfig: EnvConfig['postgres'];

  beforeEach(() => {
    mockConfig = {
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      user: 'test_user',
      password: 'test_password',
      maxConnections: 10,
    };
  });

  afterEach(async () => {
    if (client) {
      await client.disconnect();
    }
  });

  describe('constructor', () => {
    it('should create PostgresClient instance', () => {
      client = new PostgresClient(mockConfig);

      expect(client).toBeInstanceOf(PostgresClient);
      expect(client).toHaveProperty('connect');
      expect(client).toHaveProperty('disconnect');
      expect(client).toHaveProperty('query');
    });
  });

  describe('connect', () => {
    it('should establish connection to database', async () => {
      client = new PostgresClient(mockConfig);

      await expect(client.connect()).resolves.not.toThrow();
    });

    it('should not throw if already connected', async () => {
      client = new PostgresClient(mockConfig);

      await client.connect();
      await expect(client.connect()).resolves.not.toThrow();
    });
  });

  describe('disconnect', () => {
    it('should close database connection', async () => {
      client = new PostgresClient(mockConfig);
      await client.connect();

      await expect(client.disconnect()).resolves.not.toThrow();
    });

    it('should not throw if not connected', async () => {
      client = new PostgresClient(mockConfig);

      await expect(client.disconnect()).resolves.not.toThrow();
    });
  });

  describe('query', () => {
    it('should execute query and return results', async () => {
      client = new PostgresClient(mockConfig);
      await client.connect();

      const result = await client.query('SELECT 1 as value');

      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
    });

    it('should execute parameterized query', async () => {
      client = new PostgresClient(mockConfig);
      await client.connect();

      const result = await client.query('SELECT $1::text as value', ['test']);

      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should throw error if not connected', async () => {
      client = new PostgresClient(mockConfig);

      await expect(client.query('SELECT 1')).rejects.toThrow();
    });

    it('should throw error for invalid query', async () => {
      client = new PostgresClient(mockConfig);
      await client.connect();

      await expect(client.query('INVALID SQL')).rejects.toThrow();
    });
  });

  describe('transaction', () => {
    it('should begin transaction', async () => {
      client = new PostgresClient(mockConfig);
      await client.connect();

      await expect(client.beginTransaction()).resolves.not.toThrow();
    });

    it('should commit transaction', async () => {
      client = new PostgresClient(mockConfig);
      await client.connect();

      await client.beginTransaction();
      await expect(client.commit()).resolves.not.toThrow();
    });

    it('should rollback transaction', async () => {
      client = new PostgresClient(mockConfig);
      await client.connect();

      await client.beginTransaction();
      await expect(client.rollback()).resolves.not.toThrow();
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      client = new PostgresClient(mockConfig);

      expect(client.isConnected()).toBe(false);
    });

    it('should return true when connected', async () => {
      client = new PostgresClient(mockConfig);
      await client.connect();

      expect(client.isConnected()).toBe(true);
    });

    it('should return false after disconnect', async () => {
      client = new PostgresClient(mockConfig);
      await client.connect();
      await client.disconnect();

      expect(client.isConnected()).toBe(false);
    });
  });
});
