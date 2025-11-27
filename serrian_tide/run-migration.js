/**
 * Run a specific migration file
 * Usage: node run-migration.js migrations/0005_add_is_setup_complete.sql
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { Pool } from 'pg';

config({ path: '.env.local' });

async function runMigration() {
  const migrationFile = process.argv[2];
  
  if (!migrationFile) {
    console.error('❌ Please provide a migration file path');
    console.log('Usage: node run-migration.js migrations/0005_add_is_setup_complete.sql');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log(`📦 Reading migration file: ${migrationFile}...`);
    const migration = readFileSync(migrationFile, 'utf-8');

    console.log('🚀 Running migration...');
    await pool.query(migration);

    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
