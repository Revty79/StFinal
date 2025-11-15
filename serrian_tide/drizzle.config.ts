import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Explicitly load .env.local (Next.js uses this for local dev)
loadEnv({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Did you create .env.local?');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
});
