import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getSessionUser } from "@/server/session";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function mapNpcRow(row: any, canEdit: boolean) {
  return {
    id: row.id,
    name: row.name,
    alias: row.alias,
    importance: row.importance,
    role: row.role,
    race: row.race,
    occupation: row.occupation,
    location: row.location,
    timelineTag: row.timeline_tag,
    tags: row.tags,
    age: row.age,
    gender: row.gender,

    descriptionShort: row.description_short,
    appearance: row.appearance,

    strength: row.strength,
    dexterity: row.dexterity,
    constitution: row.constitution,
    intelligence: row.intelligence,
    wisdom: row.wisdom,
    charisma: row.charisma,

    baseMovement: row.base_movement,
    hpTotal: row.hp_total,
    initiative: row.initiative,
    armorSoak: row.armor_soak,
    defenseNotes: row.defense_notes,

    challengeRating: row.challenge_rating,
    skillAllocations: row.skill_allocations,
    skillCheckpoint: row.skill_checkpoint,
    isInitialSetupLocked: row.is_initial_setup_locked,
    xpSpent: row.xp_spent,
    xpCheckpoint: row.xp_checkpoint,

    personality: row.personality,
    ideals: row.ideals,
    bonds: row.bonds,
    flaws: row.flaws,
    goals: row.goals,
    secrets: row.secrets,
    backstory: row.backstory,
    motivations: row.motivations,
    hooks: row.hooks,

    faction: row.faction,
    relationships: row.relationships,
    attitudeTowardParty: row.attitude_toward_party,
    allies: row.allies,
    enemies: row.enemies,
    affiliations: row.affiliations,
    resources: row.resources,

    notes: row.notes,
    isFree: row.is_free,
    isPublished: row.is_published,
    createdBy: row.created_by,
    canEdit,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/worldbuilder/npcs/:id
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await context.params;

    // Admins can view all, users can view their own + free content
    const query = user.role === 'admin'
      ? 'SELECT * FROM npcs WHERE id = $1'
      : 'SELECT * FROM npcs WHERE id = $1 AND (created_by = $2 OR is_free = true)';
    
    const params = user.role === 'admin' ? [id] : [id, user.id];
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const row = result.rows[0];
    const canEdit = user.role === 'admin' || row.created_by === user.id;

    const npc = mapNpcRow(row, canEdit);

    return NextResponse.json({ ok: true, npc, canEdit });
  } catch (err) {
    console.error("Get npc error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// PUT /api/worldbuilder/npcs/:id
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => null) as any;

    if (!body) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Helper to add field to update
    const addField = (dbField: string, bodyField: string, transform?: (v: any) => any) => {
      if (body[bodyField] !== undefined) {
        updates.push(`${dbField} = $${paramCount}`);
        values.push(transform ? transform(body[bodyField]) : body[bodyField]);
        paramCount++;
      }
    };

    addField('name', 'name');
    addField('alias', 'alias');
    addField('importance', 'importance');
    addField('role', 'role');
    if (body.race !== undefined || body.Race !== undefined) {
      updates.push(`race = $${paramCount}`);
      values.push(body.race ?? body.Race);
      paramCount++;
    }
    addField('occupation', 'occupation');
    addField('location', 'location');
    addField('timeline_tag', 'timelineTag');
    addField('tags', 'tags');
    addField('age', 'age');
    addField('gender', 'gender');
    
    addField('description_short', 'descriptionShort');
    addField('appearance', 'appearance');
    
    addField('strength', 'strength');
    addField('dexterity', 'dexterity');
    addField('constitution', 'constitution');
    addField('intelligence', 'intelligence');
    addField('wisdom', 'wisdom');
    addField('charisma', 'charisma');
    
    addField('base_movement', 'baseMovement');
    addField('hp_total', 'hpTotal');
    addField('initiative', 'initiative');
    addField('armor_soak', 'armorSoak');
    addField('defense_notes', 'defenseNotes');
    
    addField('challenge_rating', 'challengeRating');
    addField('skill_allocations', 'skillAllocations', JSON.stringify);
    addField('skill_checkpoint', 'skillCheckpoint', JSON.stringify);
    addField('is_initial_setup_locked', 'isInitialSetupLocked');
    addField('xp_spent', 'xpSpent');
    addField('xp_checkpoint', 'xpCheckpoint');
    
    addField('personality', 'personality');
    addField('ideals', 'ideals');
    addField('bonds', 'bonds');
    addField('flaws', 'flaws');
    addField('goals', 'goals');
    addField('secrets', 'secrets');
    addField('backstory', 'backstory');
    addField('motivations', 'motivations');
    addField('hooks', 'hooks');
    
    addField('faction', 'faction');
    addField('relationships', 'relationships');
    addField('attitude_toward_party', 'attitudeTowardParty');
    addField('allies', 'allies');
    addField('enemies', 'enemies');
    addField('affiliations', 'affiliations');
    addField('resources', 'resources');
    
    addField('notes', 'notes');
    addField('is_free', 'isFree');
    addField('is_published', 'isPublished');

    // Always update timestamp
    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      // Only timestamp update, nothing else to do
      return NextResponse.json({ ok: true });
    }

    // Build and execute query
    const whereClause = user.role === 'admin'
      ? `id = $${paramCount}`
      : `id = $${paramCount} AND created_by = $${paramCount + 1}`;
    
    values.push(id);
    if (user.role !== 'admin') {
      values.push(user.id);
    }

    const query = `UPDATE npcs SET ${updates.join(', ')} WHERE ${whereClause} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      if (user.role === 'admin') {
        return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      }

      const existenceCheck = await pool.query(
        'SELECT created_by FROM npcs WHERE id = $1',
        [id]
      );

      if (existenceCheck.rowCount === 0) {
        return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      }

      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const row = result.rows[0];
    const canEdit = user.role === 'admin' || row.created_by === user.id;
    const npc = mapNpcRow(row, canEdit);

    return NextResponse.json({ ok: true, npc, canEdit });
  } catch (err) {
    console.error("Update npc error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/worldbuilder/npcs/:id
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await context.params;

    const query = user.role === 'admin'
      ? 'DELETE FROM npcs WHERE id = $1 RETURNING id'
      : 'DELETE FROM npcs WHERE id = $1 AND created_by = $2 RETURNING id';
    
    const params = user.role === 'admin' ? [id] : [id, user.id];
    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
      if (user.role === 'admin') {
        return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      }

      const existenceCheck = await pool.query(
        'SELECT created_by FROM npcs WHERE id = $1',
        [id]
      );

      if (existenceCheck.rowCount === 0) {
        return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      }

      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete npc error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
