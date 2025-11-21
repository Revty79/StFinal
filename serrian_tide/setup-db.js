/**
 * Run the database schema file
 * Usage: node setup-db.js
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { Pool } from 'pg';

config({ path: '.env.local' });

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('📦 Reading schema file...');
    const schema = readFileSync('./db_schema.sql', 'utf-8');

    console.log('🚀 Running schema...');
    await pool.query(schema);

    console.log('✅ Database schema created successfully!');
    console.log('✅ Roles seeded!');
    
    // Verify roles
    const result = await pool.query('SELECT code, name FROM roles ORDER BY code');
    console.log('\n📋 Available roles:');
    result.rows.forEach(row => {
      console.log(`  - ${row.code}: ${row.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
