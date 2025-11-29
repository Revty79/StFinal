import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and, or } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import { getRoleCapabilities } from "@/lib/authorization";
import crypto from "crypto";

// GET /api/worldbuilder/inventory/artifacts
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { isAdmin } = getRoleCapabilities(user.role);

    // Admin sees all, others see their own + free content
    const artifacts = isAdmin
      ? await db.select().from(schema.inventoryArtifacts).orderBy(schema.inventoryArtifacts.name)
      : await db
          .select()
          .from(schema.inventoryArtifacts)
          .where(
            or(
              eq(schema.inventoryArtifacts.createdBy, user.id),
              eq(schema.inventoryArtifacts.isFree, true)
            )
          )
          .orderBy(schema.inventoryArtifacts.name);

    return NextResponse.json({ ok: true, artifacts });
  } catch (err) {
    console.error("Get artifacts error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/worldbuilder/inventory/artifacts
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

    const newArtifact = {
      id,
      createdBy: user.id,
      name: body.name,
      timelineTag: body.timelineTag || null,
      costCredits: body.costCredits || null,
      category: body.category || null,
      rarity: body.rarity || null,
      attunement: body.attunement || null,
      genreTags: body.genreTags || null,
      mechanicalEffect: body.mechanicalEffect || null,
      curse: body.curse || null,
      originLore: body.originLore || null,
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

    await db.insert(schema.inventoryArtifacts).values(newArtifact);

    return NextResponse.json({ ok: true, id, artifact: newArtifact });
  } catch (err) {
    console.error("Create artifact error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
