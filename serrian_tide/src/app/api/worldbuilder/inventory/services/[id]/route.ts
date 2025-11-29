import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { inventoryServices } from "@/db/schema";
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
      ? eq(inventoryServices.id, id)
      : and(
          eq(inventoryServices.id, id),
          or(
            eq(inventoryServices.createdBy, user.id),
            eq(inventoryServices.isFree, true)
          )
        );

    const [service] = await db
      .select()
      .from(inventoryServices)
      .where(whereClause);

    if (!service) {
      return NextResponse.json({ ok: false, error: "Service not found" }, { status: 404 });
    }

    const canEdit = isAdmin || service.createdBy === user.id;

    return NextResponse.json({ ok: true, service, canEdit });
  } catch (error) {
    console.error("GET /api/worldbuilder/inventory/services/[id] error:", error);
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
      ? eq(inventoryServices.id, id)
      : and(
          eq(inventoryServices.id, id),
          eq(inventoryServices.createdBy, user.id)
        );

    const [service] = await db
      .update(inventoryServices)
      .set({
        name: data.name,
        timelineTag: data.timelineTag ?? null,
        costCredits: data.costCredits ?? null,
        category: data.category ?? null,
        duration: data.duration ?? null,
        genreTags: data.genreTags ?? null,
        mechanicalEffect: data.mechanicalEffect ?? null,
        weight: data.weight ?? null,
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

    if (!service) {
      return NextResponse.json({ ok: false, error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, service });
  } catch (error) {
    console.error("PUT /api/worldbuilder/inventory/services/[id] error:", error);
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
      ? eq(inventoryServices.id, id)
      : and(
          eq(inventoryServices.id, id),
          eq(inventoryServices.createdBy, user.id)
        );

    await db
      .delete(inventoryServices)
      .where(whereClause);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/worldbuilder/inventory/services/[id] error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
