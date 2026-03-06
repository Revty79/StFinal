import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSessionUser } from "@/server/session";
import {
  canUseGalaxy,
  cleanOptionalString,
  cleanRequiredName,
  getEditableWorld,
  getReadableWorld,
  serializeEra,
  serializeMarker,
  serializeSetting,
  serializeWorld,
  worldExists,
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
    const world = await getReadableWorld(user, worldId);
    if (!world) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const [eras, settings, markers] = await Promise.all([
      db
        .select()
        .from(schema.galaxyEras)
        .where(eq(schema.galaxyEras.worldId, worldId))
        .orderBy(asc(schema.galaxyEras.orderIndex), asc(schema.galaxyEras.name)),
      db
        .select()
        .from(schema.galaxySettings)
        .where(eq(schema.galaxySettings.worldId, worldId))
        .orderBy(asc(schema.galaxySettings.name)),
      db
        .select()
        .from(schema.galaxyMarkers)
        .where(eq(schema.galaxyMarkers.worldId, worldId))
        .orderBy(asc(schema.galaxyMarkers.year), asc(schema.galaxyMarkers.name)),
    ]);

    const serializedWorld = serializeWorld(world, user);
    return NextResponse.json({
      ok: true,
      canEdit: serializedWorld.canEdit,
      world: {
        ...serializedWorld,
        eras: eras.map((row) => serializeEra(row, user)),
        settings: settings.map((row) => serializeSetting(row, user)),
        markers: markers.map((row) => serializeMarker(row, user)),
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
    const existing = await getEditableWorld(user, worldId);
    if (!existing) {
      const exists = await worldExists(worldId);
      if (!exists) {
        return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
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

    if ("isFree" in body) {
      if (typeof body.isFree !== "boolean") {
        return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
      }
      updates.isFree = body.isFree;
      hasUpdates = true;
    }

    if ("isPublished" in body) {
      if (typeof body.isPublished !== "boolean") {
        return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
      }
      updates.isPublished = body.isPublished;
      hasUpdates = true;
    }

    if (!hasUpdates) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    await db
      .update(schema.galaxyWorlds)
      .set(updates)
      .where(eq(schema.galaxyWorlds.id, worldId));

    const updated = await getReadableWorld(user, worldId);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      world: serializeWorld(updated, user),
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
    const existing = await getEditableWorld(user, worldId);
    if (!existing) {
      const exists = await worldExists(worldId);
      if (!exists) {
        return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    await db.delete(schema.galaxyWorlds).where(eq(schema.galaxyWorlds.id, worldId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete galaxy world error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
