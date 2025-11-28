require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkDatabaseSchema() {
  try {
    console.log('Checking online database schema...\n');
    
    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('=== EXISTING TABLES ===');
    tablesResult.rows.forEach(row => console.log('  -', row.table_name));
    console.log();
    
    // Get all columns for each table
    const allColumns = await pool.query(`
      SELECT 
        table_name,
        column_name, 
        data_type,
        character_maximum_length,
        is_nullable, 
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `);
    
    // Group by table
    const tableColumns = {};
    allColumns.rows.forEach(col => {
      if (!tableColumns[col.table_name]) {
        tableColumns[col.table_name] = [];
      }
      tableColumns[col.table_name].push(col);
    });
    
    // Print each table
    for (const [tableName, columns] of Object.entries(tableColumns)) {
      console.log(`=== ${tableName.toUpperCase()} TABLE ===`);
      columns.forEach(col => {
        let typeInfo = col.data_type;
        if (col.character_maximum_length) {
          typeInfo += `(${col.character_maximum_length})`;
        }
        const nullable = col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  ${col.column_name}: ${typeInfo} ${nullable}${defaultVal}`);
      });
      console.log();
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabaseSchema();
