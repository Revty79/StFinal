import { config } from 'dotenv';
config({ path: '.env.local' });

import { Pool } from 'pg';

async function seed() {
  console.log('🌱 Seeding database...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Insert roles
    await pool.query(`
      INSERT INTO roles (code, name, description) VALUES
      ('admin', 'Administrator', 'Full system access with unlimited capabilities'),
      ('privileged', 'Privileged User', 'Special access with unlimited world slots'),
      ('world_builder', 'World Builder', 'Can create up to 3 worlds'),
      ('world_developer', 'World Developer', 'Can create up to 6 worlds'),
      ('universe_creator', 'Universe Creator', 'Can create up to 12 worlds'),
      ('free', 'Free User', 'Basic access with no world creation')
      ON CONFLICT (code) DO NOTHING
    `);

    console.log('✅ Roles seeded');
    console.log('✨ Database seeding complete!');
  } finally {
    await pool.end();
  }
}

seed()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
