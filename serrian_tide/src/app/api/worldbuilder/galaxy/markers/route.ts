import crypto from "crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSessionUser } from "@/server/session";
import {
  canUseGalaxy,
  cleanOptionalString,
  cleanRequiredName,
  eraExists,
  getEditableEra,
  getEditableMarker,
  getEditableSetting,
  getEditableWorld,
  markerExists,
  parseNullableInteger,
  parseVisibility,
  settingExists,
  serializeMarker,
  worldExists,
} from "@/lib/galaxy/server";

type UpsertMarkerBody = {
  id?: unknown;
  worldId?: unknown;
  eraId?: unknown;
  settingId?: unknown;
  name?: unknown;
  description?: unknown;
  year?: unknown;
  category?: unknown;
  visibility?: unknown;
};

// POST /api/worldbuilder/galaxy/markers
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!canUseGalaxy(user.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as UpsertMarkerBody | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const worldId = typeof body.worldId === "string" ? body.worldId.trim() : "";
    if (!worldId) {
      return NextResponse.json({ ok: false, error: "WORLD_REQUIRED" }, { status: 400 });
    }

    const world = await getEditableWorld(user, worldId);
    if (!world) {
      const exists = await worldExists(worldId);
      if (!exists) {
        return NextResponse.json({ ok: false, error: "WORLD_NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const eraId = typeof body.eraId === "string" ? body.eraId.trim() : "";
    if (eraId) {
      const era = await getEditableEra(user, eraId);
      if (!era) {
        const eraIsPresent = await eraExists(eraId);
        if (!eraIsPresent) {
          return NextResponse.json({ ok: false, error: "ERA_NOT_FOUND" }, { status: 404 });
        }
        return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
      }
      if (era.worldId !== worldId) {
        return NextResponse.json({ ok: false, error: "WORLD_MISMATCH" }, { status: 400 });
      }
    }

    const settingId = typeof body.settingId === "string" ? body.settingId.trim() : "";
    if (settingId) {
      const setting = await getEditableSetting(user, settingId);
      if (!setting) {
        const settingIsPresent = await settingExists(settingId);
        if (!settingIsPresent) {
          return NextResponse.json({ ok: false, error: "SETTING_NOT_FOUND" }, { status: 404 });
        }
        return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
      }
      if (setting.worldId !== worldId) {
        return NextResponse.json({ ok: false, error: "WORLD_MISMATCH" }, { status: 400 });
      }
      if (eraId && setting.eraId && setting.eraId !== eraId) {
        return NextResponse.json({ ok: false, error: "ERA_SETTING_MISMATCH" }, { status: 400 });
      }
    }

    const name = cleanRequiredName(body.name);
    if (!name) {
      return NextResponse.json({ ok: false, error: "EVENT_NAME_REQUIRED" }, { status: 400 });
    }

    const year = parseNullableInteger(body.year);
    if (year === "INVALID") {
      return NextResponse.json({ ok: false, error: "INVALID_YEAR" }, { status: 400 });
    }

    const markerId = typeof body.id === "string" ? body.id.trim() : "";
    const existing = markerId ? await getEditableMarker(user, markerId) : null;
    if (markerId && !existing) {
      const exists = await markerExists(markerId);
      if (!exists) {
        return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    if (existing && existing.worldId !== worldId) {
      return NextResponse.json({ ok: false, error: "WORLD_MISMATCH" }, { status: 400 });
    }

    const parsedVisibility =
      body.visibility === undefined && existing
        ? parseVisibility(existing.visibility)
        : body.visibility === undefined
          ? "canon"
          : parseVisibility(body.visibility);
    if (parsedVisibility === "INVALID") {
      return NextResponse.json({ ok: false, error: "INVALID_VISIBILITY" }, { status: 400 });
    }

    const now = new Date();
    const normalizedEraId = eraId || null;
    const normalizedSettingId = settingId || null;
    const category = cleanOptionalString(body.category);

    if (existing) {
      await db
        .update(schema.galaxyMarkers)
        .set({
          worldId,
          eraId: normalizedEraId,
          settingId: normalizedSettingId,
          name,
          description: cleanOptionalString(body.description),
          year,
          category,
          visibility: parsedVisibility,
          updatedAt: now,
        })
        .where(eq(schema.galaxyMarkers.id, markerId));

      const updatedRows = await db
        .select()
        .from(schema.galaxyMarkers)
        .where(eq(schema.galaxyMarkers.id, markerId))
        .limit(1);

      const updated = updatedRows[0];
      if (!updated) {
        return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      }

      return NextResponse.json({ ok: true, marker: serializeMarker(updated, user) });
    }

    const created = {
      id: crypto.randomUUID(),
      worldId,
      eraId: normalizedEraId,
      settingId: normalizedSettingId,
      createdBy: user.id,
      name,
      description: cleanOptionalString(body.description),
      year,
      category,
      visibility: parsedVisibility,
      createdAt: now,
      updatedAt: now,
    } satisfies typeof schema.galaxyMarkers.$inferInsert;

    await db.insert(schema.galaxyMarkers).values(created);

    return NextResponse.json(
      {
        ok: true,
        marker: serializeMarker(created, user),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Upsert galaxy marker error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
