import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";

// GET /api/worldbuilder/creatures
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Admins can see all creatures, regular users see only their own
    const creatures = user.role === 'admin'
      ? await db.select().from(schema.creatures).orderBy(schema.creatures.name)
      : await db
          .select()
          .from(schema.creatures)
          .where(eq(schema.creatures.createdBy, user.id))
          .orderBy(schema.creatures.name);

    return NextResponse.json({ ok: true, creatures });
  } catch (err) {
    console.error("Get creatures error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/worldbuilder/creatures
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

    const newCreature = {
      id,
      createdBy: user.id,
      name: body.name,
      altNames: body.altNames || null,
      challengeRating: body.challengeRating || null,
      encounterScale: body.encounterScale || null,
      type: body.type || null,
      role: body.role || null,
      size: body.size || null,
      genreTags: body.genreTags || null,
      descriptionShort: body.descriptionShort || null,
      strength: body.strength || null,
      dexterity: body.dexterity || null,
      constitution: body.constitution || null,
      intelligence: body.intelligence || null,
      wisdom: body.wisdom || null,
      charisma: body.charisma || null,
      hpTotal: body.hpTotal || null,
      initiative: body.initiative || null,
      hpByLocation: body.hpByLocation || null,
      armorSoak: body.armorSoak || null,
      attackModes: body.attackModes || null,
      damage: body.damage || null,
      rangeText: body.rangeText || null,
      specialAbilities: body.specialAbilities || null,
      magicResonanceInteraction: body.magicResonanceInteraction || null,
      behaviorTactics: body.behaviorTactics || null,
      habitat: body.habitat || null,
      diet: body.diet || null,
      variants: body.variants || null,
      lootHarvest: body.lootHarvest || null,
      storyHooks: body.storyHooks || null,
      notes: body.notes || null,
      canBeMount: body.canBeMount !== undefined ? body.canBeMount : false,
      canBePet: body.canBePet !== undefined ? body.canBePet : false,
      canBeCompanion: body.canBeCompanion !== undefined ? body.canBeCompanion : false,
      isFree: body.isFree !== undefined ? body.isFree : false,
      isPublished: body.isPublished !== undefined ? body.isPublished : false,
    };

    await db.insert(schema.creatures).values(newCreature);

    return NextResponse.json({ ok: true, id, creature: newCreature });
  } catch (err) {
    console.error("Create creature error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
