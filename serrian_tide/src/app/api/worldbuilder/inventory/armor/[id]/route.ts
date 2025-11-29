import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and, or } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import { getRoleCapabilities } from "@/lib/authorization";

// GET /api/worldbuilder/inventory/armor/[id]
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
      ? eq(schema.inventoryArmor.id, id)
      : and(
          eq(schema.inventoryArmor.id, id),
          or(
            eq(schema.inventoryArmor.createdBy, user.id),
            eq(schema.inventoryArmor.isFree, true)
          )
        );

    const armor = await db
      .select()
      .from(schema.inventoryArmor)
      .where(whereClause)
      .limit(1);

    if (armor.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const armorData = armor[0]!;
    const canEdit = isAdmin || armorData.createdBy === user.id;

    return NextResponse.json({ ok: true, armor: armorData, canEdit });
  } catch (err) {
    console.error("Get armor error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// PUT /api/worldbuilder/inventory/armor/[id]
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
      ? eq(schema.inventoryArmor.id, id)
      : and(
          eq(schema.inventoryArmor.id, id),
          eq(schema.inventoryArmor.createdBy, user.id)
        );

    await db
      .update(schema.inventoryArmor)
      .set({
        name: body.name,
        timelineTag: body.timelineTag || null,
        costCredits: body.costCredits || null,
        areaCovered: body.areaCovered || null,
        soak: body.soak || null,
        category: body.category || null,
        atype: body.atype || null,
        genreTags: body.genreTags || null,
        weight: body.weight || null,
        encumbrancePenalty: body.encumbrancePenalty || null,
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
    console.error("Update armor error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/worldbuilder/inventory/armor/[id]
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
      ? eq(schema.inventoryArmor.id, id)
      : and(
          eq(schema.inventoryArmor.id, id),
          eq(schema.inventoryArmor.createdBy, user.id)
        );

    await db
      .delete(schema.inventoryArmor)
      .where(whereClause);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete armor error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
