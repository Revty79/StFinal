import crypto from "crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSessionUser } from "@/server/session";
import {
  canUseGalaxy,
  cleanOptionalString,
  cleanRequiredName,
  getAccessibleEra,
  getAccessibleWorld,
  getNextEraOrderIndex,
  normalizeYearRange,
  parseColorHex,
  parseNullableInteger,
  parseOrderIndex,
  serializeEra,
} from "@/lib/galaxy/server";

type UpsertEraBody = {
  id?: unknown;
  worldId?: unknown;
  name?: unknown;
  description?: unknown;
  startYear?: unknown;
  endYear?: unknown;
  colorHex?: unknown;
  orderIndex?: unknown;
};

// POST /api/worldbuilder/galaxy/eras
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!canUseGalaxy(user.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as UpsertEraBody | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const worldId = typeof body.worldId === "string" ? body.worldId.trim() : "";
    if (!worldId) {
      return NextResponse.json({ ok: false, error: "WORLD_REQUIRED" }, { status: 400 });
    }

    const world = await getAccessibleWorld(user, worldId);
    if (!world) {
      return NextResponse.json({ ok: false, error: "WORLD_NOT_FOUND" }, { status: 404 });
    }

    const name = cleanRequiredName(body.name);
    if (!name) {
      return NextResponse.json({ ok: false, error: "ERA_NAME_REQUIRED" }, { status: 400 });
    }

    const startYear = parseNullableInteger(body.startYear);
    const endYear = parseNullableInteger(body.endYear);
    if (startYear === "INVALID" || endYear === "INVALID") {
      return NextResponse.json({ ok: false, error: "INVALID_YEAR" }, { status: 400 });
    }

    const orderIndex = parseOrderIndex(body.orderIndex);
    if (orderIndex === "INVALID") {
      return NextResponse.json({ ok: false, error: "INVALID_ORDER_INDEX" }, { status: 400 });
    }

    const colorHex = parseColorHex(body.colorHex);
    if (colorHex === "INVALID") {
      return NextResponse.json({ ok: false, error: "INVALID_COLOR" }, { status: 400 });
    }

    const years = normalizeYearRange(startYear, endYear);
    const now = new Date();
    const eraId = typeof body.id === "string" ? body.id.trim() : "";

    if (eraId) {
      const existing = await getAccessibleEra(user, eraId);
      if (!existing) {
        return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      }

      if (existing.worldId !== worldId) {
        return NextResponse.json({ ok: false, error: "WORLD_MISMATCH" }, { status: 400 });
      }

      await db
        .update(schema.galaxyEras)
        .set({
          name,
          description: cleanOptionalString(body.description),
          startYear: years.startYear,
          endYear: years.endYear,
          colorHex,
          orderIndex: orderIndex ?? existing.orderIndex,
          updatedAt: now,
        })
        .where(eq(schema.galaxyEras.id, eraId));

      const updatedRows = await db
        .select()
        .from(schema.galaxyEras)
        .where(eq(schema.galaxyEras.id, eraId))
        .limit(1);

      const updated = updatedRows[0];
      if (!updated) {
        return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      }

      return NextResponse.json({ ok: true, era: serializeEra(updated) });
    }

    const created = {
      id: crypto.randomUUID(),
      worldId,
      createdBy: user.id,
      name,
      description: cleanOptionalString(body.description),
      startYear: years.startYear,
      endYear: years.endYear,
      colorHex,
      orderIndex: orderIndex ?? (await getNextEraOrderIndex(worldId)),
      createdAt: now,
      updatedAt: now,
    } satisfies typeof schema.galaxyEras.$inferInsert;

    await db.insert(schema.galaxyEras).values(created);

    return NextResponse.json(
      {
        ok: true,
        era: serializeEra(created),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Upsert galaxy era error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
