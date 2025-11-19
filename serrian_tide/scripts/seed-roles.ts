/**
 * Seed default roles into the database
 * Run with: npx tsx scripts/seed-roles.ts
 */

import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: '.env.local' });

const DEFAULT_ROLES = [
  {
    code: 'admin',
    name: 'Administrator',
    description: 'Full system access and management capabilities',
  },
  {
    code: 'privileged',
    name: 'Privileged User',
    description: 'Enhanced access with special privileges',
  },
  {
    code: 'universe_creator',
    name: 'Universe Creator',
    description: 'Can create and manage multiple universes',
  },
  {
    code: 'world_developer',
    name: 'World Developer',
    description: 'Can develop detailed worlds and content',
  },
  {
    code: 'world_builder',
    name: 'World Builder',
    description: 'Can build and modify worlds',
  },
  {
    code: 'free',
    name: 'Free User',
    description: 'Basic access with limited features',
  },
];

async function seedRoles() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🌱 Seeding roles...');

    for (const role of DEFAULT_ROLES) {
      try {
        await pool.query(
          `INSERT INTO roles (code, name, description) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (code) DO NOTHING`,
          [role.code, role.name, role.description]
        );
        console.log(`✓ Role "${role.name}" (${role.code})`);
      } catch (err) {
        console.error(`✗ Failed to insert role ${role.code}:`, err);
      }
    }

    console.log('\n✅ Roles seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedRoles();
