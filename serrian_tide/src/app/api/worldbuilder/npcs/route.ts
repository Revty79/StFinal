import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/worldbuilder/npcs
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Admins see all, users see their own + free content
    const query = user.role === 'admin'
      ? 'SELECT * FROM npcs ORDER BY name'
      : 'SELECT * FROM npcs WHERE created_by = $1 OR is_free = true ORDER BY name';
    
    const params = user.role === 'admin' ? [] : [user.id];
    const result = await pool.query(query, params);

    // Transform to camelCase and add canEdit flag
    const npcs = result.rows.map((row) => ({
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
      canEdit: user.role === 'admin' || row.created_by === user.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ ok: true, npcs });
  } catch (err) {
    console.error("Get npcs error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/worldbuilder/npcs
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as any;
    if (!body || !body.name) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const id = crypto.randomUUID();

    const query = `
      INSERT INTO npcs (
        id, created_by, name, alias, importance, role, race, occupation, location, 
        timeline_tag, tags, age, gender, description_short, appearance,
        strength, dexterity, constitution, intelligence, wisdom, charisma,
        base_movement, hp_total, initiative, armor_soak, defense_notes,
        challenge_rating, skill_allocations, skill_checkpoint, is_initial_setup_locked, 
        xp_spent, xp_checkpoint,
        personality, ideals, bonds, flaws, goals, secrets, backstory, motivations, hooks,
        faction, relationships, attitude_toward_party, allies, enemies, affiliations, resources,
        notes, is_free, is_published
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
        $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51
      ) RETURNING *
    `;

    const values = [
      id,
      user.id,
      body.name,
      body.alias || null,
      body.importance || null,
      body.role || null,
      body.Race || body.race || null,
      body.occupation || null,
      body.location || null,
      body.timelineTag || null,
      body.tags || null,
      body.age || null,
      body.gender || null,
      body.descriptionShort || null,
      body.appearance || null,
      
      body.strength ?? 25,
      body.dexterity ?? 25,
      body.constitution ?? 25,
      body.intelligence ?? 25,
      body.wisdom ?? 25,
      body.charisma ?? 25,
      
      body.baseMovement ?? 5,
      body.hpTotal || null,
      body.initiative || null,
      body.armorSoak || null,
      body.defenseNotes || null,
      
      body.challengeRating ?? 1,
      JSON.stringify(body.skillAllocations || {}),
      JSON.stringify(body.skillCheckpoint || {}),
      body.isInitialSetupLocked ?? false,
      body.xpSpent ?? 0,
      body.xpCheckpoint ?? 0,
      
      body.personality || null,
      body.ideals || null,
      body.bonds || null,
      body.flaws || null,
      body.goals || null,
      body.secrets || null,
      body.backstory || null,
      body.motivations || null,
      body.hooks || null,
      
      body.faction || null,
      body.relationships || null,
      body.attitudeTowardParty || null,
      body.allies || null,
      body.enemies || null,
      body.affiliations || null,
      body.resources || null,
      
      body.notes || null,
      body.isFree !== undefined ? body.isFree : true,
      body.isPublished !== undefined ? body.isPublished : false,
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];

    const npc = {
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
      canEdit: true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return NextResponse.json({ ok: true, id, npc });
  } catch (err) {
    console.error("Create npc error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
