import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and, or } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

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
    const whereClause = user.role === 'admin'
      ? eq(schema.npcs.id, id)
      : and(
          eq(schema.npcs.id, id),
          or(
            eq(schema.npcs.createdBy, user.id),
            eq(schema.npcs.isFree, true)
          )
        );

    const npc = await db
      .select()
      .from(schema.npcs)
      .where(whereClause)
      .limit(1);

    if (npc.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const npcData = npc[0]!;
    const canEdit = user.role === 'admin' || npcData.createdBy === user.id;

    return NextResponse.json({ ok: true, npc: npcData, canEdit });
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

    const updates: any = {
      updatedAt: new Date(),
    };

    // Map all possible fields
    if (body.name !== undefined) updates.name = body.name;
    if (body.alias !== undefined) updates.alias = body.alias;
    if (body.importance !== undefined) updates.importance = body.importance;
    if (body.role !== undefined) updates.role = body.role;
    if (body.Race !== undefined) updates.race = body.Race;
    if (body.race !== undefined) updates.race = body.race;
    if (body.occupation !== undefined) updates.occupation = body.occupation;
    if (body.location !== undefined) updates.location = body.location;
    if (body.timelineTag !== undefined) updates.timelineTag = body.timelineTag;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.age !== undefined) updates.age = body.age;
    if (body.gender !== undefined) updates.gender = body.gender;
    
    if (body.descriptionShort !== undefined) updates.descriptionShort = body.descriptionShort;
    if (body.appearance !== undefined) updates.appearance = body.appearance;
    
    if (body.strength !== undefined) updates.strength = body.strength;
    if (body.dexterity !== undefined) updates.dexterity = body.dexterity;
    if (body.constitution !== undefined) updates.constitution = body.constitution;
    if (body.intelligence !== undefined) updates.intelligence = body.intelligence;
    if (body.wisdom !== undefined) updates.wisdom = body.wisdom;
    if (body.charisma !== undefined) updates.charisma = body.charisma;
    
    if (body.baseMovement !== undefined) updates.baseMovement = body.baseMovement;
    if (body.hpTotal !== undefined) updates.hpTotal = body.hpTotal;
    if (body.initiative !== undefined) updates.initiative = body.initiative;
    if (body.armorSoak !== undefined) updates.armorSoak = body.armorSoak;
    if (body.defenseNotes !== undefined) updates.defenseNotes = body.defenseNotes;
    
    if (body.challengeRating !== undefined) updates.challengeRating = body.challengeRating;
    if (body.skillAllocations !== undefined) updates.skillAllocations = body.skillAllocations;
    if (body.skillCheckpoint !== undefined) updates.skillCheckpoint = body.skillCheckpoint;
    if (body.isInitialSetupLocked !== undefined) updates.isInitialSetupLocked = body.isInitialSetupLocked;
    if (body.xpSpent !== undefined) updates.xpSpent = body.xpSpent;
    if (body.xpCheckpoint !== undefined) updates.xpCheckpoint = body.xpCheckpoint;
    
    if (body.personality !== undefined) updates.personality = body.personality;
    if (body.ideals !== undefined) updates.ideals = body.ideals;
    if (body.bonds !== undefined) updates.bonds = body.bonds;
    if (body.flaws !== undefined) updates.flaws = body.flaws;
    if (body.goals !== undefined) updates.goals = body.goals;
    if (body.secrets !== undefined) updates.secrets = body.secrets;
    if (body.backstory !== undefined) updates.backstory = body.backstory;
    if (body.hooks !== undefined) updates.hooks = body.hooks;
    
    if (body.faction !== undefined) updates.faction = body.faction;
    if (body.relationships !== undefined) updates.relationships = body.relationships;
    if (body.attitudeTowardParty !== undefined) updates.attitudeTowardParty = body.attitudeTowardParty;
    if (body.resources !== undefined) updates.resources = body.resources;
    if (body.allies !== undefined) updates.allies = body.allies;
    if (body.enemies !== undefined) updates.enemies = body.enemies;
    if (body.affiliations !== undefined) updates.affiliations = body.affiliations;
    
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.isFree !== undefined) updates.isFree = body.isFree;
    if (body.isPublished !== undefined) updates.isPublished = body.isPublished;

    await db
      .update(schema.npcs)
      .set(updates)
      .where(
        user.role === 'admin'
          ? eq(schema.npcs.id, id)
          : and(eq(schema.npcs.id, id), eq(schema.npcs.createdBy, user.id))
      );

    return NextResponse.json({ ok: true });
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

    await db
      .delete(schema.npcs)
      .where(
        user.role === 'admin'
          ? eq(schema.npcs.id, id)
          : and(eq(schema.npcs.id, id), eq(schema.npcs.createdBy, user.id))
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete npc error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
