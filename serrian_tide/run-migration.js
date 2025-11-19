const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load .env.local
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read and execute the migration file
    const sql = fs.readFileSync('./drizzle/0004_huge_sue_storm.sql', 'utf-8');
    
    // Split by statement breakpoint and execute
    const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
    
    for (const statement of statements) {
      try {
        await client.query(statement);
        console.log('✓ Executed statement');
      } catch (err) {
        if (err.code === '42P07') {
          console.log('⊘ Table already exists, skipping');
        } else {
          console.error('✗ Error:', err.message);
        }
      }
    }

    console.log('\nMigration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
