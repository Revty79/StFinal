import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and, or, asc } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";

// GET /api/worldbuilder/races
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const races = await db
      .select()
      .from(schema.races)
      .where(
        or(
          eq(schema.races.createdBy, user.id),
          eq(schema.races.isFree, true)
        )
      )
      .orderBy(asc(schema.races.name));

    // Transform races to include flattened max attributes for easier access
    const transformedRaces = races.map(race => {
      const attrs = race.attributes as any || {};
      return {
        ...race,
        maxStrength: attrs.strength_max ? parseInt(attrs.strength_max) : 50,
        maxDexterity: attrs.dexterity_max ? parseInt(attrs.dexterity_max) : 50,
        maxConstitution: attrs.constitution_max ? parseInt(attrs.constitution_max) : 50,
        maxIntelligence: attrs.intelligence_max ? parseInt(attrs.intelligence_max) : 50,
        maxWisdom: attrs.wisdom_max ? parseInt(attrs.wisdom_max) : 50,
        maxCharisma: attrs.charisma_max ? parseInt(attrs.charisma_max) : 50,
        baseMovement: attrs.base_movement ? parseInt(attrs.base_movement) : 5,
      };
    });

    return NextResponse.json({ ok: true, races: transformedRaces });
  } catch (err) {
    console.error("Get races error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/worldbuilder/races
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

    const newRace = {
      id,
      createdBy: user.id,
      name: body.name,
      definition: body.definition || null,
      attributes: body.attributes || null,
      bonusSkills: body.bonusSkills || null,
      specialAbilities: body.specialAbilities || null,
      isFree: body.isFree !== undefined ? body.isFree : true,
      isPublished: body.isPublished !== undefined ? body.isPublished : false,
    };

    await db.insert(schema.races).values(newRace);

    return NextResponse.json({ ok: true, id, race: newRace });
  } catch (err) {
    console.error("Create race error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
