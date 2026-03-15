import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { asc, eq, or } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";
import { buildRaceHierarchyMetaMap } from "@/lib/raceHierarchy";

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

function resolveMasterRaceLabel(
  race: { name: string; masterLabel: string | null | undefined },
  hierarchyLabel: string | undefined
): string {
  const manualLabel = normalizeOptionalText(race.masterLabel);
  if (manualLabel) return manualLabel;
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

// GET /api/worldbuilder/races
export async function GET(request: Request) {
  void request;
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const races = await getVisibleRacesForUser(user);
    const worldNameById = await getVisibleWorldNameMapForUser(user);
    const hierarchyByRaceId = buildRaceHierarchyMetaMap(
      races.map((race) => ({
        id: race.id,
        name: race.name,
        parentRaceId: race.parentRaceId,
        parent2RaceId: race.parent2RaceId,
      }))
    );

    // Transform races to include flattened max attributes for easier access
    const transformedRaces = races.map((race) => {
      const attrs = (race.attributes as any) || {};
      const canEdit = isAdmin(user) || race.createdBy === user.id;
      const hierarchy = hierarchyByRaceId.get(race.id);
      const worldId = normalizeWorldId(race.worldId);
      return {
        ...race,
        worldId,
        worldName: worldId ? worldNameById.get(worldId) ?? null : null,
        canEdit, // Add explicit canEdit flag
        masterLabel: race.masterLabel ?? null,
        masterRaceId: hierarchy?.masterRaceId ?? race.id,
        masterRaceLabel: resolveMasterRaceLabel(race, hierarchy?.masterRaceLabel),
        lineageDepth: hierarchy?.lineageDepth ?? 0,
        lineagePath: hierarchy?.lineagePath ?? [race.name],
        hasLineageCycle: hierarchy?.hasLineageCycle ?? false,
        maxStrength: attrs.strength_max ? parseInt(attrs.strength_max) : 50,
        maxDexterity: attrs.dexterity_max ? parseInt(attrs.dexterity_max) : 50,
        maxConstitution: attrs.constitution_max ? parseInt(attrs.constitution_max) : 50,
        maxIntelligence: attrs.intelligence_max ? parseInt(attrs.intelligence_max) : 50,
        maxWisdom: attrs.wisdom_max ? parseInt(attrs.wisdom_max) : 50,
        maxCharisma: attrs.charisma_max ? parseInt(attrs.charisma_max) : 50,
        baseMagic: attrs.base_magic ? parseInt(attrs.base_magic) : 0,
        baseMovement: attrs.base_movement ? parseInt(attrs.base_movement) : 5,
      };
    });

    return NextResponse.json({ ok: true, races: transformedRaces });
  } catch (err) {
    console.error("Get races error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/worldbuilder/races
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as any;
    const name = normalizeName(body?.name);
    if (!body || !name) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const worldId = normalizeWorldId(body.worldId);
    const worldValidation = await validateWorldAccess(user, worldId);
    if (!worldValidation.ok) {
      return NextResponse.json({ ok: false, error: worldValidation.error }, { status: worldValidation.status });
    }

    const parentRaceId = normalizeParentRaceId(body.parentRaceId);
    const parent2RaceId = normalizeParentRaceId(body.parent2RaceId);
    if (parentRaceId && parent2RaceId && parentRaceId === parent2RaceId) {
      return NextResponse.json({ ok: false, error: "RACE_PARENTS_DUPLICATE" }, { status: 400 });
    }

    const parent1Validation = await validateParentRaceAccess(user, parentRaceId, worldId);
    if (!parent1Validation.ok) {
      return NextResponse.json({ ok: false, error: parent1Validation.error }, { status: parent1Validation.status });
    }

    const parent2Validation = await validateParentRaceAccess(user, parent2RaceId, worldId);
    if (!parent2Validation.ok) {
      return NextResponse.json({ ok: false, error: parent2Validation.error }, { status: parent2Validation.status });
    }

    const id = crypto.randomUUID();

    const newRace = {
      id,
      createdBy: user.id,
      worldId,
      parentRaceId,
      parent2RaceId,
      name,
      masterLabel: normalizeOptionalText(body.masterLabel ?? body.masterRaceLabel),
      tagline: body.tagline ?? null,
      definition: body.definition || null,
      attributes: body.attributes || null,
      bonusSkills: body.bonusSkills || null,
      specialAbilities: body.specialAbilities || null,
      isFree: body.isFree !== undefined ? Boolean(body.isFree) : false,
      isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : false,
    };

    const insertedRows = await db.insert(schema.races).values(newRace).returning();
    const insertedRace = insertedRows[0]!;

    const visibleRaces = await getVisibleRacesForUser(user);
    const worldNameById = await getVisibleWorldNameMapForUser(user);
    const hierarchyByRaceId = buildRaceHierarchyMetaMap(
      visibleRaces.map((race) => ({
        id: race.id,
        name: race.name,
        parentRaceId: race.parentRaceId,
        parent2RaceId: race.parent2RaceId,
      }))
    );

    const hierarchy = hierarchyByRaceId.get(insertedRace.id);
    const normalizedWorldId = normalizeWorldId(insertedRace.worldId);

    return NextResponse.json({
      ok: true,
      id,
      race: {
        ...insertedRace,
        worldId: normalizedWorldId,
        worldName: normalizedWorldId ? worldNameById.get(normalizedWorldId) ?? null : null,
        canEdit: true,
        masterRaceId: hierarchy?.masterRaceId ?? insertedRace.id,
        masterRaceLabel: resolveMasterRaceLabel(insertedRace, hierarchy?.masterRaceLabel),
        lineageDepth: hierarchy?.lineageDepth ?? 0,
        lineagePath: hierarchy?.lineagePath ?? [insertedRace.name],
        hasLineageCycle: hierarchy?.hasLineageCycle ?? false,
      },
    });
  } catch (err) {
    console.error("Create race error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
