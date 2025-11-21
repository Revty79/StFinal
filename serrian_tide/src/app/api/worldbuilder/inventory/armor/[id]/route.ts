import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

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

    const armor = await db
      .select()
      .from(schema.inventoryArmor)
      .where(and(
        eq(schema.inventoryArmor.id, id),
        eq(schema.inventoryArmor.createdBy, user.id)
      ))
      .limit(1);

    if (armor.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const armorData = armor[0];
    const canEdit = armorData.createdBy === user.id;

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
        isFree: body.isFree,
        isPublished: body.isPublished,
        updatedAt: new Date(),
      })
      .where(and(
        eq(schema.inventoryArmor.id, id),
        eq(schema.inventoryArmor.createdBy, user.id)
      ));

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

    await db
      .delete(schema.inventoryArmor)
      .where(and(
        eq(schema.inventoryArmor.id, id),
        eq(schema.inventoryArmor.createdBy, user.id)
      ));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete armor error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
