import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { and, asc, eq, or } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import { buildRaceHierarchyMetaMap, wouldCreateRaceCycle } from "@/lib/raceHierarchy";

type SessionUser = {
  id: string;
  role: string;
};

function isAdmin(user: SessionUser) {
  return String(user.role).toLowerCase() === "admin";
}

function normalizeParentRaceId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeName(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function getVisibleRacesForUser(user: SessionUser) {
  return isAdmin(user)
    ? db.select().from(schema.races).orderBy(asc(schema.races.name))
    : db
        .select()
        .from(schema.races)
        .where(or(eq(schema.races.createdBy, user.id), eq(schema.races.isFree, true)))
        .orderBy(asc(schema.races.name));
}

async function validateParentRaceAccess(user: SessionUser, parentRaceId: string | null) {
  if (!parentRaceId) {
    return { ok: true as const };
  }

  const rows = await db
    .select({
      id: schema.races.id,
      createdBy: schema.races.createdBy,
      isFree: schema.races.isFree,
    })
    .from(schema.races)
    .where(eq(schema.races.id, parentRaceId))
    .limit(1);

  const parent = rows[0];
  if (!parent) {
    return {
      ok: false as const,
      status: 400,
      error: "INVALID_PARENT_RACE",
    };
  }

  const canAccessParent = isAdmin(user) || parent.createdBy === user.id || parent.isFree;
  if (!canAccessParent) {
    return {
      ok: false as const,
      status: 403,
      error: "PARENT_RACE_FORBIDDEN",
    };
  }

  return { ok: true as const };
}

async function checkRaceExists(id: string) {
  const rows = await db
    .select({ id: schema.races.id })
    .from(schema.races)
    .where(eq(schema.races.id, id))
    .limit(1);

  return rows.length > 0;
}

// GET /api/worldbuilder/races/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;

    // Admins can view all, users can view their own + free content
    const whereClause = user.role === 'admin'
      ? eq(schema.races.id, id)
      : and(
          eq(schema.races.id, id),
          or(
            eq(schema.races.createdBy, user.id),
            eq(schema.races.isFree, true)
          )
        );

    const race = await db
      .select()
      .from(schema.races)
      .where(whereClause)
      .limit(1);

    if (race.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const raceData = race[0]!;
    const canEdit = isAdmin(user) || raceData.createdBy === user.id;

    const visibleRaces = await getVisibleRacesForUser(user);
    const hierarchyByRaceId = buildRaceHierarchyMetaMap(
      visibleRaces.map((visibleRace) => ({
        id: visibleRace.id,
        name: visibleRace.name,
        parentRaceId: visibleRace.parentRaceId,
      }))
    );
    const hierarchy = hierarchyByRaceId.get(raceData.id);

    return NextResponse.json({
      ok: true,
      race: {
        ...raceData,
        masterRaceId: hierarchy?.masterRaceId ?? raceData.id,
        masterRaceLabel: hierarchy?.masterRaceLabel ?? raceData.name,
        lineageDepth: hierarchy?.lineageDepth ?? 0,
        lineagePath: hierarchy?.lineagePath ?? [raceData.name],
        hasLineageCycle: hierarchy?.hasLineageCycle ?? false,
      },
      canEdit,
    });
  } catch (err) {
    console.error("Get race error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// PUT /api/worldbuilder/races/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await req.json().catch(() => null)) as any;
    
    if (!body) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      const name = normalizeName(body.name);
      if (!name) {
        return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
      }
      updates.name = name;
    }

    if (body.tagline !== undefined) {
      updates.tagline = body.tagline ?? null;
    }
    if (body.definition !== undefined) {
      updates.definition = body.definition || null;
    }
    if (body.attributes !== undefined) {
      updates.attributes = body.attributes || null;
    }
    if (body.bonusSkills !== undefined) {
      updates.bonusSkills = body.bonusSkills || null;
    }
    if (body.specialAbilities !== undefined) {
      updates.specialAbilities = body.specialAbilities || null;
    }
    if (body.isFree !== undefined) {
      updates.isFree = Boolean(body.isFree);
    }
    if (body.isPublished !== undefined) {
      updates.isPublished = Boolean(body.isPublished);
    }

    if (body.parentRaceId !== undefined) {
      const parentRaceId = normalizeParentRaceId(body.parentRaceId);
      if (parentRaceId === id) {
        return NextResponse.json({ ok: false, error: "RACE_PARENT_SELF" }, { status: 400 });
      }

      const parentValidation = await validateParentRaceAccess(user, parentRaceId);
      if (!parentValidation.ok) {
        return NextResponse.json({ ok: false, error: parentValidation.error }, { status: parentValidation.status });
      }

      const allRaces = await db
        .select({ id: schema.races.id, parentRaceId: schema.races.parentRaceId })
        .from(schema.races);

      if (wouldCreateRaceCycle(allRaces, id, parentRaceId)) {
        return NextResponse.json({ ok: false, error: "RACE_PARENT_CYCLE" }, { status: 400 });
      }

      updates.parentRaceId = parentRaceId;
    }

    const updatedRows = await db
      .update(schema.races)
      .set(updates)
      .where(
        user.role === 'admin'
          ? eq(schema.races.id, id)
          : and(
              eq(schema.races.id, id),
              eq(schema.races.createdBy, user.id)
            )
      )
      .returning();

    if (updatedRows.length === 0) {
      const exists = await checkRaceExists(id);
      if (!exists) {
        return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const updatedRace = updatedRows[0]!;
    const visibleRaces = await getVisibleRacesForUser(user);
    const hierarchyByRaceId = buildRaceHierarchyMetaMap(
      visibleRaces.map((visibleRace) => ({
        id: visibleRace.id,
        name: visibleRace.name,
        parentRaceId: visibleRace.parentRaceId,
      }))
    );
    const hierarchy = hierarchyByRaceId.get(updatedRace.id);

    return NextResponse.json({
      ok: true,
      race: {
        ...updatedRace,
        canEdit: true,
        masterRaceId: hierarchy?.masterRaceId ?? updatedRace.id,
        masterRaceLabel: hierarchy?.masterRaceLabel ?? updatedRace.name,
        lineageDepth: hierarchy?.lineageDepth ?? 0,
        lineagePath: hierarchy?.lineagePath ?? [updatedRace.name],
        hasLineageCycle: hierarchy?.hasLineageCycle ?? false,
      },
    });
  } catch (err) {
    console.error("Update race error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/worldbuilder/races/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;

    const deletedRows = await db
      .delete(schema.races)
      .where(
        user.role === 'admin'
          ? eq(schema.races.id, id)
          : and(
              eq(schema.races.id, id),
              eq(schema.races.createdBy, user.id)
            )
      )
      .returning({ id: schema.races.id });

    if (deletedRows.length === 0) {
      const exists = await checkRaceExists(id);
      if (!exists) {
        return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete race error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
