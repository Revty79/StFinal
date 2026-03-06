import crypto from "crypto";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { canUseGalaxy, cleanOptionalString, cleanRequiredName, isAdminRole, serializeWorld } from "@/lib/galaxy/server";

// GET /api/worldbuilder/galaxy/worlds
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!canUseGalaxy(user.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const rows = isAdminRole(user.role)
      ? await db.select().from(schema.galaxyWorlds).orderBy(desc(schema.galaxyWorlds.createdAt))
      : await db
          .select()
          .from(schema.galaxyWorlds)
          .where(eq(schema.galaxyWorlds.createdBy, user.id))
          .orderBy(desc(schema.galaxyWorlds.createdAt));

    return NextResponse.json({
      ok: true,
      worlds: rows.map(serializeWorld),
    });
  } catch (err) {
    console.error("Get galaxy worlds error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/worldbuilder/galaxy/worlds
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!canUseGalaxy(user.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as { name?: unknown; description?: unknown } | null;
    const name = cleanRequiredName(body?.name);
    if (!name) {
      return NextResponse.json({ ok: false, error: "WORLD_NAME_REQUIRED" }, { status: 400 });
    }

    const world = {
      id: crypto.randomUUID(),
      createdBy: user.id,
      name,
      description: cleanOptionalString(body?.description),
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies typeof schema.galaxyWorlds.$inferInsert;

    await db.insert(schema.galaxyWorlds).values(world);

    return NextResponse.json(
      {
        ok: true,
        world: serializeWorld(world),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create galaxy world error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
