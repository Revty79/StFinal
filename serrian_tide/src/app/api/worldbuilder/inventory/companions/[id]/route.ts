import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { inventoryCompanions } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import { getRoleCapabilities } from "@/lib/authorization";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { isAdmin } = getRoleCapabilities(user.role);

    // Admin can view anything, others only their own or free content
    const whereClause = isAdmin
      ? eq(inventoryCompanions.id, id)
      : and(
          eq(inventoryCompanions.id, id),
          or(
            eq(inventoryCompanions.createdBy, user.id),
            eq(inventoryCompanions.isFree, true)
          )
        );

    const [companion] = await db
      .select()
      .from(inventoryCompanions)
      .where(whereClause);

    if (!companion) {
      return NextResponse.json({ ok: false, error: "Companion not found" }, { status: 404 });
    }

    const canEdit = isAdmin || companion.createdBy === user.id;

    return NextResponse.json({ ok: true, companion, canEdit });
  } catch (error) {
    console.error("GET /api/worldbuilder/inventory/companions/[id] error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    const { isAdmin } = getRoleCapabilities(user.role);

    // Admin can edit anything, others only their own
    const whereClause = isAdmin
      ? eq(inventoryCompanions.id, id)
      : and(
          eq(inventoryCompanions.id, id),
          eq(inventoryCompanions.createdBy, user.id)
        );

    const [companion] = await db
      .update(inventoryCompanions)
      .set({
        name: data.name,
        companionType: data.companionType ?? null,
        creatureId: data.creatureId ?? null,
        creatureName: data.creatureName ?? null,
        timelineTag: data.timelineTag ?? null,
        costCredits: data.costCredits ?? null,
        genreTags: data.genreTags ?? null,
        loyalty: data.loyalty ?? null,
        training: data.training ?? null,
        personalityTraits: data.personalityTraits ?? null,
        bond: data.bond ?? null,
        mechanicalEffect: data.mechanicalEffect ?? null,
        narrativeNotes: data.narrativeNotes ?? null,
        usageType: data.usageType ?? null,
        maxCharges: data.maxCharges ?? null,
        rechargeWindow: data.rechargeWindow ?? null,
        rechargeNotes: data.rechargeNotes ?? null,
        effectHooks: data.effectHooks ?? null,
        updatedAt: new Date(),
      })
      .where(whereClause)
      .returning();

    if (!companion) {
      return NextResponse.json({ ok: false, error: "Companion not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, companion });
  } catch (error) {
    console.error("PUT /api/worldbuilder/inventory/companions/[id] error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { isAdmin } = getRoleCapabilities(user.role);

    // Admin can delete anything, others only their own
    const whereClause = isAdmin
      ? eq(inventoryCompanions.id, id)
      : and(
          eq(inventoryCompanions.id, id),
          eq(inventoryCompanions.createdBy, user.id)
        );

    await db
      .delete(inventoryCompanions)
      .where(whereClause);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/worldbuilder/inventory/companions/[id] error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
