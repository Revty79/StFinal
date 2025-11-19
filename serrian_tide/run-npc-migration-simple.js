const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    const sql = fs.readFileSync('run-npc-migration.sql', 'utf-8');
    
    // Split into individual statements and execute each
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} statements to execute\n`);

    for (const statement of statements) {
      try {
        await client.query(statement);
        // Extract column name from ALTER TABLE statement
        const match = statement.match(/ADD COLUMN IF NOT EXISTS (\w+)/);
        const columnName = match ? match[1] : 'column';
        console.log(`✓ Added ${columnName}`);
      } catch (err) {
        console.error(`✗ Error:`, err.message);
      }
    }

    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
