import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSessionUser } from "@/server/session";
import {
  canUseGalaxy,
  cleanOptionalString,
  cleanRequiredName,
  getAccessibleWorld,
  isAdminRole,
  serializeEra,
  serializeMarker,
  serializeSetting,
  serializeWorld,
} from "@/lib/galaxy/server";

// GET /api/worldbuilder/galaxy/worlds/[worldId]
export async function GET(
  req: Request,
  context: { params: Promise<{ worldId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!canUseGalaxy(user.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const { worldId } = await context.params;
    const world = await getAccessibleWorld(user, worldId);
    if (!world) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const erasWhere = isAdminRole(user.role)
      ? eq(schema.galaxyEras.worldId, worldId)
      : and(eq(schema.galaxyEras.worldId, worldId), eq(schema.galaxyEras.createdBy, user.id));
    const settingsWhere = isAdminRole(user.role)
      ? eq(schema.galaxySettings.worldId, worldId)
      : and(eq(schema.galaxySettings.worldId, worldId), eq(schema.galaxySettings.createdBy, user.id));
    const markersWhere = isAdminRole(user.role)
      ? eq(schema.galaxyMarkers.worldId, worldId)
      : and(eq(schema.galaxyMarkers.worldId, worldId), eq(schema.galaxyMarkers.createdBy, user.id));

    const [eras, settings, markers] = await Promise.all([
      db
        .select()
        .from(schema.galaxyEras)
        .where(erasWhere)
        .orderBy(asc(schema.galaxyEras.orderIndex), asc(schema.galaxyEras.name)),
      db
        .select()
        .from(schema.galaxySettings)
        .where(settingsWhere)
        .orderBy(asc(schema.galaxySettings.name)),
      db
        .select()
        .from(schema.galaxyMarkers)
        .where(markersWhere)
        .orderBy(asc(schema.galaxyMarkers.year), asc(schema.galaxyMarkers.name)),
    ]);

    return NextResponse.json({
      ok: true,
      world: {
        ...serializeWorld(world),
        eras: eras.map(serializeEra),
        settings: settings.map(serializeSetting),
        markers: markers.map(serializeMarker),
      },
    });
  } catch (err) {
    console.error("Get galaxy world error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// PUT /api/worldbuilder/galaxy/worlds/[worldId]
export async function PUT(
  req: Request,
  context: { params: Promise<{ worldId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!canUseGalaxy(user.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const { worldId } = await context.params;
    const existing = await getAccessibleWorld(user, worldId);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const updates: Partial<typeof schema.galaxyWorlds.$inferInsert> = {
      updatedAt: new Date(),
    };
    let hasUpdates = false;

    if ("name" in body) {
      const name = cleanRequiredName(body.name);
      if (!name) {
        return NextResponse.json({ ok: false, error: "WORLD_NAME_REQUIRED" }, { status: 400 });
      }
      updates.name = name;
      hasUpdates = true;
    }

    if ("description" in body) {
      updates.description = cleanOptionalString(body.description);
      hasUpdates = true;
    }

    if (!hasUpdates) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    await db
      .update(schema.galaxyWorlds)
      .set(updates)
      .where(eq(schema.galaxyWorlds.id, worldId));

    const updated = await getAccessibleWorld(user, worldId);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      world: serializeWorld(updated),
    });
  } catch (err) {
    console.error("Update galaxy world error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/worldbuilder/galaxy/worlds/[worldId]
export async function DELETE(
  req: Request,
  context: { params: Promise<{ worldId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!canUseGalaxy(user.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const { worldId } = await context.params;
    const existing = await getAccessibleWorld(user, worldId);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    await db.delete(schema.galaxyWorlds).where(eq(schema.galaxyWorlds.id, worldId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete galaxy world error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
