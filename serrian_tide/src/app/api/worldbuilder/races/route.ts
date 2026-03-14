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

// GET /api/worldbuilder/races
export async function GET(request: Request) {
  void request;
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const races = await getVisibleRacesForUser(user);
    const hierarchyByRaceId = buildRaceHierarchyMetaMap(
      races.map((race) => ({
        id: race.id,
        name: race.name,
        parentRaceId: race.parentRaceId,
      }))
    );

    // Transform races to include flattened max attributes for easier access
    const transformedRaces = races.map((race) => {
      const attrs = (race.attributes as any) || {};
      const canEdit = isAdmin(user) || race.createdBy === user.id;
      const hierarchy = hierarchyByRaceId.get(race.id);
      return {
        ...race,
        canEdit, // Add explicit canEdit flag
        masterRaceId: hierarchy?.masterRaceId ?? race.id,
        masterRaceLabel: hierarchy?.masterRaceLabel ?? race.name,
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

    const parentRaceId = normalizeParentRaceId(body.parentRaceId);
    const parentValidation = await validateParentRaceAccess(user, parentRaceId);
    if (!parentValidation.ok) {
      return NextResponse.json({ ok: false, error: parentValidation.error }, { status: parentValidation.status });
    }

    const id = crypto.randomUUID();

    const newRace = {
      id,
      createdBy: user.id,
      parentRaceId,
      name,
      tagline: body.tagline ?? null,
      definition: body.definition || null,
      attributes: body.attributes || null,
      bonusSkills: body.bonusSkills || null,
      specialAbilities: body.specialAbilities || null,
      isFree: body.isFree !== undefined ? Boolean(body.isFree) : false,
      isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : false,
    };

    await db.insert(schema.races).values(newRace);

    const visibleRaces = await getVisibleRacesForUser(user);
    const hierarchyByRaceId = buildRaceHierarchyMetaMap(
      visibleRaces.map((race) => ({
        id: race.id,
        name: race.name,
        parentRaceId: race.parentRaceId,
      }))
    );

    const hierarchy = hierarchyByRaceId.get(id);

    return NextResponse.json({
      ok: true,
      id,
      race: {
        ...newRace,
        canEdit: true,
        masterRaceId: hierarchy?.masterRaceId ?? id,
        masterRaceLabel: hierarchy?.masterRaceLabel ?? name,
        lineageDepth: hierarchy?.lineageDepth ?? 0,
        lineagePath: hierarchy?.lineagePath ?? [name],
        hasLineageCycle: hierarchy?.hasLineageCycle ?? false,
      },
    });
  } catch (err) {
    console.error("Create race error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
