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

function normalizeWorldId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeName(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeClassifications(value: unknown): string[] {
  const source = Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of source) {
    if (typeof entry !== "string") continue;
    const label = entry.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

function resolveClassificationsFromBody(body: any): string[] {
  if (body?.classifications !== undefined) {
    return normalizeClassifications(body.classifications);
  }
  const legacyLabel = normalizeOptionalText(body?.masterLabel ?? body?.masterRaceLabel);
  return legacyLabel ? [legacyLabel] : [];
}

function resolvePrimaryClassification(
  race: { name: string; classifications?: unknown; masterLabel?: string | null | undefined },
  hierarchyLabel: string | undefined
): string {
  const classifications = normalizeClassifications(race.classifications);
  if (classifications.length > 0) return classifications[0]!;
  const legacyLabel = normalizeOptionalText(race.masterLabel);
  if (legacyLabel) return legacyLabel;
  const fallbackHierarchyLabel = normalizeOptionalText(hierarchyLabel);
  if (fallbackHierarchyLabel) return fallbackHierarchyLabel;
  return normalizeName(race.name) || "Unnamed Race";
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

async function getVisibleWorldNameMapForUser(user: SessionUser) {
  const worlds = isAdmin(user)
    ? await db
        .select({
          id: schema.galaxyWorlds.id,
          name: schema.galaxyWorlds.name,
        })
        .from(schema.galaxyWorlds)
    : await db
        .select({
          id: schema.galaxyWorlds.id,
          name: schema.galaxyWorlds.name,
        })
        .from(schema.galaxyWorlds)
        .where(
          or(
            eq(schema.galaxyWorlds.createdBy, user.id),
            eq(schema.galaxyWorlds.isFree, true)
          )
        );

  return new Map(worlds.map((world) => [world.id, world.name]));
}

async function validateWorldAccess(user: SessionUser, worldId: string | null) {
  if (!worldId) {
    return { ok: true as const };
  }

  const rows = await db
    .select({
      id: schema.galaxyWorlds.id,
      createdBy: schema.galaxyWorlds.createdBy,
    })
    .from(schema.galaxyWorlds)
    .where(eq(schema.galaxyWorlds.id, worldId))
    .limit(1);

  const world = rows[0];
  if (!world) {
    return {
      ok: false as const,
      status: 400,
      error: "INVALID_WORLD",
    };
  }

  const canEditWorld = isAdmin(user) || world.createdBy === user.id;
  if (!canEditWorld) {
    return {
      ok: false as const,
      status: 403,
      error: "WORLD_FORBIDDEN",
    };
  }

  return { ok: true as const };
}

async function validateParentRaceAccess(
  user: SessionUser,
  parentRaceId: string | null,
  worldId: string | null
) {
  if (!parentRaceId) {
    return { ok: true as const };
  }

  const rows = await db
    .select({
      id: schema.races.id,
      createdBy: schema.races.createdBy,
      isFree: schema.races.isFree,
      worldId: schema.races.worldId,
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

  if (normalizeWorldId(parent.worldId) !== worldId) {
    return {
      ok: false as const,
      status: 400,
      error: "PARENT_RACE_WORLD_MISMATCH",
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
  void req;
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;

    // Admins can view all, users can view their own + free content
    const whereClause = isAdmin(user)
      ? eq(schema.races.id, id)
      : and(
          eq(schema.races.id, id),
          or(eq(schema.races.createdBy, user.id), eq(schema.races.isFree, true))
        );

    const race = await db.select().from(schema.races).where(whereClause).limit(1);

    if (race.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const raceData = race[0]!;
    const canEdit = isAdmin(user) || raceData.createdBy === user.id;

    const visibleRaces = await getVisibleRacesForUser(user);
    const worldNameById = await getVisibleWorldNameMapForUser(user);
    const hierarchyByRaceId = buildRaceHierarchyMetaMap(
      visibleRaces.map((visibleRace) => ({
        id: visibleRace.id,
        name: visibleRace.name,
        parentRaceId: visibleRace.parentRaceId,
        parent2RaceId: visibleRace.parent2RaceId,
      }))
    );
    const hierarchy = hierarchyByRaceId.get(raceData.id);
    const worldId = normalizeWorldId(raceData.worldId);
    const classifications = normalizeClassifications(raceData.classifications);

    return NextResponse.json({
      ok: true,
      race: {
        ...raceData,
        worldId,
        worldName: worldId ? worldNameById.get(worldId) ?? null : null,
        classifications,
        masterRaceId: hierarchy?.masterRaceId ?? raceData.id,
        masterRaceLabel: resolvePrimaryClassification(raceData, hierarchy?.masterRaceLabel),
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

    const existingRows = await db
      .select({
        id: schema.races.id,
        createdBy: schema.races.createdBy,
        worldId: schema.races.worldId,
        parentRaceId: schema.races.parentRaceId,
        parent2RaceId: schema.races.parent2RaceId,
      })
      .from(schema.races)
      .where(eq(schema.races.id, id))
      .limit(1);

    const existing = existingRows[0];
    if (!existing) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const canEdit = isAdmin(user) || existing.createdBy === user.id;
    if (!canEdit) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
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
    if (
      body.classifications !== undefined ||
      body.masterLabel !== undefined ||
      body.masterRaceLabel !== undefined
    ) {
      const nextClassifications = resolveClassificationsFromBody(body);
      updates.classifications = nextClassifications;
      updates.masterLabel = nextClassifications[0] ?? null;
    }

    const finalWorldId =
      body.worldId !== undefined
        ? normalizeWorldId(body.worldId)
        : normalizeWorldId(existing.worldId);

    if (body.worldId !== undefined) {
      const worldValidation = await validateWorldAccess(user, finalWorldId);
      if (!worldValidation.ok) {
        return NextResponse.json(
          { ok: false, error: worldValidation.error },
          { status: worldValidation.status }
        );
      }
      updates.worldId = finalWorldId;
    }

    const finalParentRaceId =
      body.parentRaceId !== undefined
        ? normalizeParentRaceId(body.parentRaceId)
        : normalizeParentRaceId(existing.parentRaceId);
    const finalParent2RaceId =
      body.parent2RaceId !== undefined
        ? normalizeParentRaceId(body.parent2RaceId)
        : normalizeParentRaceId(existing.parent2RaceId);

    if (finalParentRaceId === id || finalParent2RaceId === id) {
      return NextResponse.json({ ok: false, error: "RACE_PARENT_SELF" }, { status: 400 });
    }
    if (
      finalParentRaceId &&
      finalParent2RaceId &&
      finalParentRaceId === finalParent2RaceId
    ) {
      return NextResponse.json(
        { ok: false, error: "RACE_PARENTS_DUPLICATE" },
        { status: 400 }
      );
    }

    const shouldRevalidateParents =
      body.parentRaceId !== undefined ||
      body.parent2RaceId !== undefined ||
      body.worldId !== undefined;

    if (shouldRevalidateParents) {
      const parent1Validation = await validateParentRaceAccess(
        user,
        finalParentRaceId,
        finalWorldId
      );
      if (!parent1Validation.ok) {
        return NextResponse.json(
          { ok: false, error: parent1Validation.error },
          { status: parent1Validation.status }
        );
      }

      const parent2Validation = await validateParentRaceAccess(
        user,
        finalParent2RaceId,
        finalWorldId
      );
      if (!parent2Validation.ok) {
        return NextResponse.json(
          { ok: false, error: parent2Validation.error },
          { status: parent2Validation.status }
        );
      }

      const allRaces = await db
        .select({
          id: schema.races.id,
          parentRaceId: schema.races.parentRaceId,
          parent2RaceId: schema.races.parent2RaceId,
        })
        .from(schema.races);

      if (wouldCreateRaceCycle(allRaces, id, finalParentRaceId, finalParent2RaceId)) {
        return NextResponse.json({ ok: false, error: "RACE_PARENT_CYCLE" }, { status: 400 });
      }
    }

    if (body.parentRaceId !== undefined) {
      updates.parentRaceId = finalParentRaceId;
    }
    if (body.parent2RaceId !== undefined) {
      updates.parent2RaceId = finalParent2RaceId;
    }

    const updatedRows = await db
      .update(schema.races)
      .set(updates)
      .where(eq(schema.races.id, id))
      .returning();

    if (updatedRows.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const updatedRace = updatedRows[0]!;
    const visibleRaces = await getVisibleRacesForUser(user);
    const worldNameById = await getVisibleWorldNameMapForUser(user);
    const hierarchyByRaceId = buildRaceHierarchyMetaMap(
      visibleRaces.map((visibleRace) => ({
        id: visibleRace.id,
        name: visibleRace.name,
        parentRaceId: visibleRace.parentRaceId,
        parent2RaceId: visibleRace.parent2RaceId,
      }))
    );
    const hierarchy = hierarchyByRaceId.get(updatedRace.id);
    const normalizedWorldId = normalizeWorldId(updatedRace.worldId);
    const normalizedClassifications = normalizeClassifications(updatedRace.classifications);

    return NextResponse.json({
      ok: true,
      race: {
        ...updatedRace,
        worldId: normalizedWorldId,
        worldName: normalizedWorldId ? worldNameById.get(normalizedWorldId) ?? null : null,
        classifications: normalizedClassifications,
        canEdit: true,
        masterRaceId: hierarchy?.masterRaceId ?? updatedRace.id,
        masterRaceLabel: resolvePrimaryClassification(updatedRace, hierarchy?.masterRaceLabel),
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
  void req;
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;

    const deletedRows = await db
      .delete(schema.races)
      .where(
        isAdmin(user)
          ? eq(schema.races.id, id)
          : and(eq(schema.races.id, id), eq(schema.races.createdBy, user.id))
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
