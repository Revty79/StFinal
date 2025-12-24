import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

// GET /api/worldbuilder/creatures/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;

    // Admins can view all creatures, users can view their own + free content
    const whereClause = user.role === 'admin'
      ? eq(schema.creatures.id, id)
      : and(
          eq(schema.creatures.id, id),
          or(
            eq(schema.creatures.createdBy, user.id),
            eq(schema.creatures.isFree, true)
          )
        );

    const creature = await db
      .select()
      .from(schema.creatures)
      .where(whereClause)
      .limit(1);

    if (creature.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const creatureData = creature[0]!;
    const canEdit = user.role === 'admin' || creatureData.createdBy === user.id;

    return NextResponse.json({ ok: true, creature: creatureData, canEdit });
  } catch (err) {
    console.error("Get creature error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// PUT /api/worldbuilder/creatures/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null) as any;
    
    if (!body) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    await db
      .update(schema.creatures)
      .set({
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
        attacks: body.attacks || null,
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
        isFree: body.isFree,
        isPublished: body.isPublished,
        updatedAt: new Date(),
      })
      .where(
        user.role === 'admin'
          ? eq(schema.creatures.id, id)
          : and(
              eq(schema.creatures.id, id),
              eq(schema.creatures.createdBy, user.id)
            )
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update creature error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/worldbuilder/creatures/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;

    await db
      .delete(schema.creatures)
      .where(
        user.role === 'admin'
          ? eq(schema.creatures.id, id)
          : and(
              eq(schema.creatures.id, id),
              eq(schema.creatures.createdBy, user.id)
            )
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete creature error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
