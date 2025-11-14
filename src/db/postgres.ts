/**
 * PostgreSQL client implementation
 */

import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import type { EnvConfig } from '@/config';

/**
 * PostgreSQL client for database operations
 */
export class PostgresClient {
  private pool: Pool | null = null;
  private connected = false;

  constructor(private readonly config: EnvConfig['postgres']) {}

  /**
   * Connect to PostgreSQL database
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      max: this.config.maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    try {
      const client = await this.pool.connect();
      client.release();
      this.connected = true;
    } catch (error) {
      this.pool = null;
      throw new Error(`Failed to connect to PostgreSQL: ${(error as Error).message}`);
    }
  }

  /**
   * Disconnect from PostgreSQL database
   */
  async disconnect(): Promise<void> {
    if (!this.pool) {
      return;
    }

    try {
      await this.pool.end();
      this.pool = null;
      this.connected = false;
    } catch (error) {
      throw new Error(`Failed to disconnect from PostgreSQL: ${(error as Error).message}`);
    }
  }

  /**
   * Execute a query
   */
  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Not connected to PostgreSQL. Call connect() first.');
    }

    try {
      return await this.pool.query<T>(text, params);
    } catch (error) {
      throw new Error(`Query execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * Execute a callback within a transaction
   * Automatically commits on success, rolls back on error
   * Supports concurrent transactions
   */
  async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('Not connected to PostgreSQL. Call connect() first.');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.pool !== null;
  }

  /**
   * Get pool instance (for advanced use cases)
   */
  getPool(): Pool | null {
    return this.pool;
  }
}
