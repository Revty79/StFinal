import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// Reuse a single Pool in dev (hot reload safe)
const globalForPool = globalThis as unknown as { __st_pool?: Pool };
export const pool =
  globalForPool.__st_pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (!globalForPool.__st_pool) globalForPool.__st_pool = pool;

// Drizzle instance with our schema
export const db = drizzle(pool, { schema });
export { schema };
