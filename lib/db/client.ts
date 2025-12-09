import { D1Database } from '@cloudflare/workers-types';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
}

// Get the D1 database from Cloudflare context
export function getDB(): D1Database {
  const { env } = getCloudflareContext();
  const db = (env as Env).DB;
  if (!db) {
    throw new Error('D1 database not available');
  }
  return db;
}

// Helper function to execute queries
export async function queryDB<T = unknown>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<D1Result<T>> {
  return await db.prepare(sql).bind(...params).all<T>();
}

// Helper function to execute a single row query
export async function queryOne<T = unknown>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const result = await db.prepare(sql).bind(...params).first<T>();
  return result || null;
}

// Helper function to execute mutations
export async function executeDB(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<D1Result> {
  return await db.prepare(sql).bind(...params).run();
}
