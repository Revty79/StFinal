import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { db } from './src/db/client.js';
import { sql } from 'drizzle-orm';

async function addNpcFields() {
  console.log('Adding missing NPC fields to database...');
  
  try {
    // Add all missing columns
    await db.execute(sql`ALTER TABLE npcs ADD COLUMN IF NOT EXISTS alias VARCHAR(255)`);
    console.log('✓ Added alias');
    
    await db.execute(sql`ALTER TABLE npcs ADD COLUMN IF NOT EXISTS importance VARCHAR(100)`);
    console.log('✓ Added importance');
    
    await db.execute(sql`ALTER TABLE npcs ADD COLUMN IF NOT EXISTS role VARCHAR(255)`);
    console.log('✓ Added role');
    
    await db.execute(sql`ALTER TABLE npcs ADD COLUMN IF NOT EXISTS location VARCHAR(255)`);
    console.log('✓ Added location');
    
    await db.execute(sql`ALTER TABLE npcs ADD COLUMN IF NOT EXISTS timeline_tag VARCHAR(100)`);
    console.log('✓ Added timeline_tag');
    
    await db.execute(sql`ALTER TABLE npcs ADD COLUMN IF NOT EXISTS tags TEXT`);
    console.log('✓ Added tags');
    
    await db.execute(sql`ALTER TABLE npcs ADD COLUMN IF NOT EXISTS armor_soak VARCHAR(100)`);
    console.log('✓ Added armor_soak');
    
    await db.execute(sql`ALTER TABLE npcs ADD COLUMN IF NOT EXISTS defense_notes TEXT`);
    console.log('✓ Added defense_notes');
    
    await db.execute(sql`ALTER TABLE npcs ADD COLUMN IF NOT EXISTS ideals TEXT`);
    console.log('✓ Added ideals');
    
    await db.execute(sql`ALTER TABLE npcs ADD COLUMN IF NOT EXISTS bonds TEXT`);
    console.log('✓ Added bonds');
    
    await db.execute(sql`ALTER TABLE npcs ADD COLUMN IF NOT EXISTS flaws TEXT`);
    console.log('✓ Added flaws');
    
    await db.execute(sql`ALTER TABLE npcs ADD COLUMN IF NOT EXISTS goals TEXT`);
    console.log('✓ Added goals');
    
    await db.execute(sql`ALTER TABLE npcs ADD COLUMN IF NOT EXISTS hooks TEXT`);
    console.log('✓ Added hooks');
    
    await db.execute(sql`ALTER TABLE npcs ADD COLUMN IF NOT EXISTS faction VARCHAR(255)`);
    console.log('✓ Added faction');
    
    await db.execute(sql`ALTER TABLE npcs ADD COLUMN IF NOT EXISTS relationships TEXT`);
    console.log('✓ Added relationships');
    
    await db.execute(sql`ALTER TABLE npcs ADD COLUMN IF NOT EXISTS attitude_toward_party VARCHAR(100)`);
    console.log('✓ Added attitude_toward_party');
    
    await db.execute(sql`ALTER TABLE npcs ADD COLUMN IF NOT EXISTS resources TEXT`);
    console.log('✓ Added resources');
    
    console.log('\n✅ Successfully added all missing NPC fields to database!');
  } catch (error) {
    console.error('❌ Error adding NPC fields:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

addNpcFields();
