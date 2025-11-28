import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";

// GET /api/worldbuilder/inventory/items
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const items = await db
      .select()
      .from(schema.inventoryItems)
      .where(eq(schema.inventoryItems.createdBy, user.id))
      .orderBy(schema.inventoryItems.name);

    return NextResponse.json({ ok: true, items });
  } catch (err) {
    console.error("Get inventory items error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/worldbuilder/inventory/items
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

    const newItem = {
      id,
      createdBy: user.id,
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
      isFree: body.isFree !== undefined ? body.isFree : false,
      isPublished: body.isPublished !== undefined ? body.isPublished : false,
    };

    await db.insert(schema.inventoryItems).values(newItem);

    return NextResponse.json({ ok: true, id, item: newItem });
  } catch (err) {
    console.error("Create inventory item error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
