import { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
}

// This will be used in API routes and server components
// The actual D1 database will be accessed via the request context
export function getDB(request: Request): D1Database {
  // In Cloudflare Pages, we access D1 via the request context
  // This will be set up in middleware or API routes
  const env = (request as any).env as Env;
  if (!env?.DB) {
    throw new Error('D1 database not available');
  }
  return env.DB;
}

// Helper function to execute queries
export async function queryDB<T = any>(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<D1Result<T>> {
  return await db.prepare(sql).bind(...params).all<T>();
}

// Helper function to execute a single row query
export async function queryOne<T = any>(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const result = await db.prepare(sql).bind(...params).first<T>();
  return result || null;
}

// Helper function to execute mutations
export async function executeDB(
  db: D1Database,
  sql: string,
  params: any[] = []
): Promise<D1Result> {
  return await db.prepare(sql).bind(...params).run();
}

