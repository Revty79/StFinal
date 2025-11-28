import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

// GET /api/worldbuilder/inventory/artifacts/[id]
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

    const artifact = await db
      .select()
      .from(schema.inventoryArtifacts)
      .where(and(
        eq(schema.inventoryArtifacts.id, id),
        eq(schema.inventoryArtifacts.createdBy, user.id)
      ))
      .limit(1);

    if (artifact.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const artifactData = artifact[0]!;
    const canEdit = artifactData.createdBy === user.id;

    return NextResponse.json({ ok: true, artifact: artifactData, canEdit });
  } catch (err) {
    console.error("Get artifact error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// PUT /api/worldbuilder/inventory/artifacts/[id]
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
      .update(schema.inventoryArtifacts)
      .set({
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
        isFree: body.isFree,
        isPublished: body.isPublished,
        updatedAt: new Date(),
      })
      .where(and(
        eq(schema.inventoryArtifacts.id, id),
        eq(schema.inventoryArtifacts.createdBy, user.id)
      ));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update artifact error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/worldbuilder/inventory/artifacts/[id]
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
      .delete(schema.inventoryArtifacts)
      .where(and(
        eq(schema.inventoryArtifacts.id, id),
        eq(schema.inventoryArtifacts.createdBy, user.id)
      ));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete artifact error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
