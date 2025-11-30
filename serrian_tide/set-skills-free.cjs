require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function setAllSkillsFree() {
  try {
    console.log('Setting all skills to is_free = true...');
    
    const result = await pool.query(`
      UPDATE skills
      SET is_free = true
      WHERE is_free = false;
    `);
    
    console.log(`✅ Updated ${result.rowCount} skills to is_free = true`);
    
    // Show total count
    const total = await pool.query('SELECT COUNT(*) as count FROM skills');
    console.log(`Total skills in database: ${total.rows[0].count}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

setAllSkillsFree();
