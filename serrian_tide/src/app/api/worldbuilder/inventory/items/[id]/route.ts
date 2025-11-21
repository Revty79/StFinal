import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

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

    const item = await db
      .select()
      .from(schema.inventoryItems)
      .where(and(
        eq(schema.inventoryItems.id, id),
        eq(schema.inventoryItems.createdBy, user.id)
      ))
      .limit(1);

    if (item.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const itemData = item[0];
    const canEdit = itemData.createdBy === user.id;

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
        isFree: body.isFree,
        isPublished: body.isPublished,
        updatedAt: new Date(),
      })
      .where(and(
        eq(schema.inventoryItems.id, id),
        eq(schema.inventoryItems.createdBy, user.id)
      ));

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

    await db
      .delete(schema.inventoryItems)
      .where(and(
        eq(schema.inventoryItems.id, id),
        eq(schema.inventoryItems.createdBy, user.id)
      ));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete inventory item error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
