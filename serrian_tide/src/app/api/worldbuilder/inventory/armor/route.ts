import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";

// GET /api/worldbuilder/inventory/armor
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const armor = await db
      .select()
      .from(schema.inventoryArmor)
      .where(eq(schema.inventoryArmor.createdBy, user.id))
      .orderBy(schema.inventoryArmor.name);

    return NextResponse.json({ ok: true, armor });
  } catch (err) {
    console.error("Get armor error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/worldbuilder/inventory/armor
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

    const newArmor = {
      id,
      createdBy: user.id,
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
      isFree: body.isFree !== undefined ? body.isFree : true,
      isPublished: body.isPublished !== undefined ? body.isPublished : false,
    };

    await db.insert(schema.inventoryArmor).values(newArmor);

    return NextResponse.json({ ok: true, id, armor: newArmor });
  } catch (err) {
    console.error("Create armor error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
