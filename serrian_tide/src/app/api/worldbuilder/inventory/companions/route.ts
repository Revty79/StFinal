import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { inventoryCompanions } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import { getRoleCapabilities } from "@/lib/authorization";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { isAdmin } = getRoleCapabilities(user.role);

    // Admin sees all, others see their own + free content
    const companions = isAdmin
      ? await db.select().from(inventoryCompanions)
      : await db
          .select()
          .from(inventoryCompanions)
          .where(
            or(
              eq(inventoryCompanions.createdBy, user.id),
              eq(inventoryCompanions.isFree, true)
            )
          );
    
    return NextResponse.json({ ok: true, companions });
  } catch (error) {
    console.error("GET /api/worldbuilder/inventory/companions error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    const newCompanion = {
      id: randomUUID(),
      createdBy: user.id,
      name: data.name,
      isFree: data.isFree ?? true,
      isPublished: data.isPublished ?? false,
      companionType: data.companionType ?? data.role ?? null,
      creatureId: data.creatureId ?? data.linkedCreatureId ?? null,
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
    };

    const [companion] = await db.insert(inventoryCompanions).values(newCompanion).returning();
    
    return NextResponse.json({ ok: true, companion });
  } catch (error) {
    console.error("POST /api/worldbuilder/inventory/companions error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
