import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and, or } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import { getRoleCapabilities } from "@/lib/authorization";

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
    const { isAdmin } = getRoleCapabilities(user.role);

    // Admin can view anything, others only their own or free content
    const whereClause = isAdmin
      ? eq(schema.inventoryWeapons.id, id)
      : and(
          eq(schema.inventoryWeapons.id, id),
          or(
            eq(schema.inventoryWeapons.createdBy, user.id),
            eq(schema.inventoryWeapons.isFree, true)
          )
        );

    const weapon = await db
      .select()
      .from(schema.inventoryWeapons)
      .where(whereClause)
      .limit(1);

    if (weapon.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const weaponData = weapon[0]!;
    const canEdit = isAdmin || weaponData.createdBy === user.id;

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

    const { isAdmin } = getRoleCapabilities(user.role);

    // Admin can edit anything, others only their own
    const whereClause = isAdmin
      ? eq(schema.inventoryWeapons.id, id)
      : and(
          eq(schema.inventoryWeapons.id, id),
          eq(schema.inventoryWeapons.createdBy, user.id)
        );

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
        rarity: body.rarity || null,
        attunement: body.attunement || null,
        curse: body.curse || null,
        usageType: body.usageType || null,
        maxCharges: body.maxCharges || null,
        rechargeWindow: body.rechargeWindow || null,
        rechargeNotes: body.rechargeNotes || null,
        effectHooks: body.effectHooks || null,
        isFree: body.isFree,
        isPublished: body.isPublished,
        updatedAt: new Date(),
      })
      .where(whereClause);

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

    const { isAdmin } = getRoleCapabilities(user.role);

    // Admin can delete anything, others only their own
    const whereClause = isAdmin
      ? eq(schema.inventoryWeapons.id, id)
      : and(
          eq(schema.inventoryWeapons.id, id),
          eq(schema.inventoryWeapons.createdBy, user.id)
        );

    await db
      .delete(schema.inventoryWeapons)
      .where(whereClause);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete weapon error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
