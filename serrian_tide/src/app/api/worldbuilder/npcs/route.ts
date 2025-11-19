import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";

// GET /api/worldbuilder/npcs
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const npcs = await db
      .select()
      .from(schema.npcs)
      .where(eq(schema.npcs.createdBy, user.id))
      .orderBy(schema.npcs.name);

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

    const newNpc = {
      id,
      createdBy: user.id,
      name: body.name,
      alias: body.alias || null,
      importance: body.importance || null,
      role: body.role || null,
      race: body.Race || body.race || null,
      occupation: body.occupation || null,
      location: body.location || null,
      timelineTag: body.timelineTag || null,
      tags: body.tags || null,
      age: body.age || null,
      gender: body.gender || null,
      
      descriptionShort: body.descriptionShort || null,
      appearance: body.appearance || null,
      
      strength: body.strength ?? 25,
      dexterity: body.dexterity ?? 25,
      constitution: body.constitution ?? 25,
      intelligence: body.intelligence ?? 25,
      wisdom: body.wisdom ?? 25,
      charisma: body.charisma ?? 25,
      
      baseMovement: body.baseMovement ?? 5,
      hpTotal: body.hpTotal || null,
      initiative: body.initiative || null,
      armorSoak: body.armorSoak || null,
      defenseNotes: body.defenseNotes || null,
      
      challengeRating: body.challengeRating ?? 1,
      skillAllocations: body.skillAllocations || {},
      skillCheckpoint: body.skillCheckpoint || {},
      isInitialSetupLocked: body.isInitialSetupLocked ?? false,
      xpSpent: body.xpSpent ?? 0,
      xpCheckpoint: body.xpCheckpoint ?? 0,
      
      personality: body.personality || null,
      ideals: body.ideals || null,
      bonds: body.bonds || null,
      flaws: body.flaws || null,
      goals: body.goals || null,
      secrets: body.secrets || null,
      backstory: body.backstory || null,
      hooks: body.hooks || null,
      
      faction: body.faction || null,
      relationships: body.relationships || null,
      attitudeTowardParty: body.attitudeTowardParty || null,
      resources: body.resources || null,
      allies: body.allies || null,
      enemies: body.enemies || null,
      affiliations: body.affiliations || null,
      
      notes: body.notes || null,
      isFree: body.isFree !== undefined ? body.isFree : true,
      isPublished: body.isPublished !== undefined ? body.isPublished : false,
    };

    await db.insert(schema.npcs).values(newNpc);

    return NextResponse.json({ ok: true, id, npc: newNpc });
  } catch (err) {
    console.error("Create npc error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
