import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { inventoryServices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const services = await db.select().from(inventoryServices).where(eq(inventoryServices.createdBy, user.id));
    
    return NextResponse.json({ ok: true, services });
  } catch (error) {
    console.error("GET /api/worldbuilder/inventory/services error:", error);
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
    
    const newService = {
      id: randomUUID(),
      createdBy: user.id,
      name: data.name,
      isFree: data.isFree ?? true,
      isPublished: data.isPublished ?? false,
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
    };

    const [service] = await db.insert(inventoryServices).values(newService).returning();
    
    return NextResponse.json({ ok: true, service });
  } catch (error) {
    console.error("POST /api/worldbuilder/inventory/services error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
