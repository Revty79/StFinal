import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";

// GET /api/worldbuilder/inventory/weapons
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const weapons = await db
      .select()
      .from(schema.inventoryWeapons)
      .where(eq(schema.inventoryWeapons.createdBy, user.id))
      .orderBy(schema.inventoryWeapons.name);

    return NextResponse.json({ ok: true, weapons });
  } catch (err) {
    console.error("Get weapons error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/worldbuilder/inventory/weapons
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

    await db.insert(schema.inventoryWeapons).values({
      id,
      createdBy: user.id,
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
      isFree: body.isFree !== undefined ? body.isFree : true,
      isPublished: body.isPublished !== undefined ? body.isPublished : false,
    });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("Create weapon error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
