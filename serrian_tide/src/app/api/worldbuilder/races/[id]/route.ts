import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and, or } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

// GET /api/worldbuilder/races/[id]
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

    // Admins can view all, users can view their own + free content
    const whereClause = user.role === 'admin'
      ? eq(schema.races.id, id)
      : and(
          eq(schema.races.id, id),
          or(
            eq(schema.races.createdBy, user.id),
            eq(schema.races.isFree, true)
          )
        );

    const race = await db
      .select()
      .from(schema.races)
      .where(whereClause)
      .limit(1);

    if (race.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const raceData = race[0]!;
    const canEdit = user.role === 'admin' || raceData.createdBy === user.id;

    return NextResponse.json({ ok: true, race: raceData, canEdit });
  } catch (err) {
    console.error("Get race error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// PUT /api/worldbuilder/races/[id]
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
      .update(schema.races)
      .set({
        name: body.name,
        definition: body.definition || null,
        attributes: body.attributes || null,
        bonusSkills: body.bonusSkills || null,
        specialAbilities: body.specialAbilities || null,
        isFree: body.isFree,
        isPublished: body.isPublished,
        updatedAt: new Date(),
      })
      .where(
        user.role === 'admin'
          ? eq(schema.races.id, id)
          : and(
              eq(schema.races.id, id),
              eq(schema.races.createdBy, user.id)
            )
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update race error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/worldbuilder/races/[id]
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
      .delete(schema.races)
      .where(
        user.role === 'admin'
          ? eq(schema.races.id, id)
          : and(
              eq(schema.races.id, id),
              eq(schema.races.createdBy, user.id)
            )
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete race error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
