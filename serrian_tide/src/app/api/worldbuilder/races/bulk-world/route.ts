import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSessionUser } from "@/server/session";

type SessionUser = {
  id: string;
  role: string;
};

function isAdmin(user: SessionUser) {
  return String(user.role).toLowerCase() === "admin";
}

function normalizeWorldId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// POST /api/worldbuilder/races/bulk-world
// Move all races/creatures created by the current user to one world.
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as {
      targetWorldId?: unknown;
    } | null;
    const targetWorldId = normalizeWorldId(body?.targetWorldId);
    if (!targetWorldId) {
      return NextResponse.json(
        { ok: false, error: "TARGET_WORLD_REQUIRED" },
        { status: 400 }
      );
    }

    const worldRows = await db
      .select({
        id: schema.galaxyWorlds.id,
        createdBy: schema.galaxyWorlds.createdBy,
      })
      .from(schema.galaxyWorlds)
      .where(eq(schema.galaxyWorlds.id, targetWorldId))
      .limit(1);

    const world = worldRows[0];
    if (!world) {
      return NextResponse.json({ ok: false, error: "INVALID_WORLD" }, { status: 400 });
    }

    if (!isAdmin(user) && world.createdBy !== user.id) {
      return NextResponse.json({ ok: false, error: "WORLD_FORBIDDEN" }, { status: 403 });
    }

    const result = await db.execute(sql`
      WITH moved AS (
        SELECT "id"
        FROM "races"
        WHERE "created_by" = ${user.id}
      ),
      updated AS (
        UPDATE "races" AS r
        SET
          "world_id" = ${targetWorldId},
          "parent_race_id" = CASE
            WHEN r."parent_race_id" IS NULL THEN NULL
            WHEN EXISTS (
              SELECT 1
              FROM moved m
              WHERE m."id" = r."parent_race_id"
            ) THEN r."parent_race_id"
            WHEN EXISTS (
              SELECT 1
              FROM "races" p
              WHERE p."id" = r."parent_race_id"
                AND p."world_id" = ${targetWorldId}
            ) THEN r."parent_race_id"
            ELSE NULL
          END,
          "parent2_race_id" = CASE
            WHEN r."parent2_race_id" IS NULL THEN NULL
            WHEN EXISTS (
              SELECT 1
              FROM moved m
              WHERE m."id" = r."parent2_race_id"
            ) THEN r."parent2_race_id"
            WHEN EXISTS (
              SELECT 1
              FROM "races" p
              WHERE p."id" = r."parent2_race_id"
                AND p."world_id" = ${targetWorldId}
            ) THEN r."parent2_race_id"
            ELSE NULL
          END,
          "updated_at" = NOW()
        WHERE r."created_by" = ${user.id}
        RETURNING r."id"
      )
      SELECT COUNT(*)::int AS "moved_count"
      FROM updated
    `);

    const movedCount =
      Number((result as { rows?: Array<{ moved_count?: number | string }> })?.rows?.[0]?.moved_count ?? 0);

    return NextResponse.json({ ok: true, movedCount });
  } catch (err) {
    console.error("Bulk move races world error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
