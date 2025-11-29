import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and, or } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import { getRoleCapabilities } from "@/lib/authorization";
import crypto from "crypto";

// GET /api/worldbuilder/inventory/weapons
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { isAdmin } = getRoleCapabilities(user.role);

    // Admin sees all, others see their own + free content
    const weapons = isAdmin
      ? await db.select().from(schema.inventoryWeapons).orderBy(schema.inventoryWeapons.name)
      : await db
          .select()
          .from(schema.inventoryWeapons)
          .where(
            or(
              eq(schema.inventoryWeapons.createdBy, user.id),
              eq(schema.inventoryWeapons.isFree, true)
            )
          )
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

    const newWeapon = {
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
      rarity: body.rarity || null,
      attunement: body.attunement || null,
      curse: body.curse || null,
      usageType: body.usageType || null,
      maxCharges: body.maxCharges || null,
      rechargeWindow: body.rechargeWindow || null,
      rechargeNotes: body.rechargeNotes || null,
      effectHooks: body.effectHooks || null,
      isFree: body.isFree !== undefined ? body.isFree : false,
      isPublished: body.isPublished !== undefined ? body.isPublished : false,
    };

    await db.insert(schema.inventoryWeapons).values(newWeapon);

    return NextResponse.json({ ok: true, id, weapon: newWeapon });
  } catch (err) {
    console.error("Create weapon error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
