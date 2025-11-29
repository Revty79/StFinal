import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and, or } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import { getRoleCapabilities } from "@/lib/authorization";

// GET /api/worldbuilder/inventory/items/[id]
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
      ? eq(schema.inventoryItems.id, id)
      : and(
          eq(schema.inventoryItems.id, id),
          or(
            eq(schema.inventoryItems.createdBy, user.id),
            eq(schema.inventoryItems.isFree, true)
          )
        );

    const item = await db
      .select()
      .from(schema.inventoryItems)
      .where(whereClause)
      .limit(1);

    if (item.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const itemData = item[0]!;
    const canEdit = isAdmin || itemData.createdBy === user.id;

    return NextResponse.json({ ok: true, item: itemData, canEdit });
  } catch (err) {
    console.error("Get inventory item error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// PUT /api/worldbuilder/inventory/items/[id]
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
      ? eq(schema.inventoryItems.id, id)
      : and(
          eq(schema.inventoryItems.id, id),
          eq(schema.inventoryItems.createdBy, user.id)
        );

    await db
      .update(schema.inventoryItems)
      .set({
        name: body.name,
        timelineTag: body.timelineTag || null,
        costCredits: body.costCredits || null,
        category: body.category || null,
        subtype: body.subtype || null,
        genreTags: body.genreTags || null,
        mechanicalEffect: body.mechanicalEffect || null,
        weight: body.weight || null,
        narrativeNotes: body.narrativeNotes || null,
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
    console.error("Update inventory item error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/worldbuilder/inventory/items/[id]
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
      ? eq(schema.inventoryItems.id, id)
      : and(
          eq(schema.inventoryItems.id, id),
          eq(schema.inventoryItems.createdBy, user.id)
        );

    await db
      .delete(schema.inventoryItems)
      .where(whereClause);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete inventory item error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
