import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

// GET /api/worldbuilder/inventory/weapons/[id]
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

    const weapon = await db
      .select()
      .from(schema.inventoryWeapons)
      .where(and(
        eq(schema.inventoryWeapons.id, id),
        eq(schema.inventoryWeapons.createdBy, user.id)
      ))
      .limit(1);

    if (weapon.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const weaponData = weapon[0]!;
    const canEdit = weaponData.createdBy === user.id;

    return NextResponse.json({ ok: true, weapon: weaponData, canEdit });
  } catch (err) {
    console.error("Get weapon error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// PUT /api/worldbuilder/inventory/weapons/[id]
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
      .update(schema.inventoryWeapons)
      .set({
        name: body.name,
        timelineTag: body.timelineTag || null,
        costCredits: body.costCredits || null,
        category: body.category || null,
        handedness: body.handedness || null,
        dtype: body.dtype || null,
        rangeType: body.rangeType || null,
        rangeText: body.rangeText || null,
        genreTags: body.genreTags || null,
        weight: body.weight || null,
        damage: body.damage || null,
        effect: body.effect || null,
        narrativeNotes: body.narrativeNotes || null,
        isFree: body.isFree,
        isPublished: body.isPublished,
        updatedAt: new Date(),
      })
      .where(and(
        eq(schema.inventoryWeapons.id, id),
        eq(schema.inventoryWeapons.createdBy, user.id)
      ));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update weapon error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/worldbuilder/inventory/weapons/[id]
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
      .delete(schema.inventoryWeapons)
      .where(and(
        eq(schema.inventoryWeapons.id, id),
        eq(schema.inventoryWeapons.createdBy, user.id)
      ));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete weapon error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
