import { and, desc, eq, or } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getRoleCapabilities } from "@/lib/authorization";

type SessionLikeUser = {
  id: string;
  role: string;
};

export type GalaxyVisibility = "canon" | "secret" | "rumor";

const VISIBILITY_VALUES: GalaxyVisibility[] = ["canon", "secret", "rumor"];

type WorldRow = typeof schema.galaxyWorlds.$inferSelect;
type EraRow = typeof schema.galaxyEras.$inferSelect;
type SettingRow = typeof schema.galaxySettings.$inferSelect;
type MarkerRow = typeof schema.galaxyMarkers.$inferSelect;

export function canUseGalaxy(role: string | null | undefined): boolean {
  return getRoleCapabilities(role).canWorldBuild;
}

export function isAdminRole(role: string | null | undefined): boolean {
  return String(role ?? "").toLowerCase() === "admin";
}

export function canEditGalaxyRow(user: SessionLikeUser, createdBy: string): boolean {
  return isAdminRole(user.role) || createdBy === user.id;
}

export function cleanRequiredName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const next = value.trim();
  return next.length > 0 ? next : null;
}

export function cleanOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const next = value.trim();
  return next.length > 0 ? next : null;
}

export function parseNullableInteger(value: unknown): number | null | "INVALID" {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    return "INVALID";
  }
  return value;
}

export function parseOrderIndex(value: unknown): number | null | "INVALID" {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    return "INVALID";
  }
  return value;
}

export function parseColorHex(value: unknown): string | null | "INVALID" {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return "INVALID";

  const raw = value.trim();
  if (!raw) return null;

  const normalized = raw.startsWith("#") ? raw : `#${raw}`;
  if (!/^#([0-9A-Fa-f]{6})$/.test(normalized)) return "INVALID";
  return normalized.toUpperCase();
}

export function parseVisibility(value: unknown): GalaxyVisibility | "INVALID" {
  if (typeof value !== "string") return "INVALID";
  const normalized = value.trim().toLowerCase();
  if (!VISIBILITY_VALUES.includes(normalized as GalaxyVisibility)) return "INVALID";
  return normalized as GalaxyVisibility;
}

export function normalizeYearRange(startYear: number | null, endYear: number | null) {
  if (startYear === null || endYear === null) {
    return { startYear, endYear };
  }
  if (startYear <= endYear) {
    return { startYear, endYear };
  }
  return { startYear: endYear, endYear: startYear };
}

export async function listReadableWorlds(user: SessionLikeUser): Promise<WorldRow[]> {
  return isAdminRole(user.role)
    ? await db.select().from(schema.galaxyWorlds).orderBy(desc(schema.galaxyWorlds.createdAt))
    : await db
        .select()
        .from(schema.galaxyWorlds)
        .where(or(eq(schema.galaxyWorlds.createdBy, user.id), eq(schema.galaxyWorlds.isFree, true)))
        .orderBy(desc(schema.galaxyWorlds.createdAt));
}

export async function getReadableWorld(user: SessionLikeUser, worldId: string): Promise<WorldRow | null> {
  const rows = isAdminRole(user.role)
    ? await db
        .select()
        .from(schema.galaxyWorlds)
        .where(eq(schema.galaxyWorlds.id, worldId))
        .limit(1)
    : await db
        .select()
        .from(schema.galaxyWorlds)
        .where(
          and(
            eq(schema.galaxyWorlds.id, worldId),
            or(eq(schema.galaxyWorlds.createdBy, user.id), eq(schema.galaxyWorlds.isFree, true)),
          ),
        )
        .limit(1);

  return rows[0] ?? null;
}

export async function getEditableWorld(user: SessionLikeUser, worldId: string): Promise<WorldRow | null> {
  const rows = isAdminRole(user.role)
    ? await db
        .select()
        .from(schema.galaxyWorlds)
        .where(eq(schema.galaxyWorlds.id, worldId))
        .limit(1)
    : await db
        .select()
        .from(schema.galaxyWorlds)
        .where(and(eq(schema.galaxyWorlds.id, worldId), eq(schema.galaxyWorlds.createdBy, user.id)))
        .limit(1);

  return rows[0] ?? null;
}

export async function getEditableEra(user: SessionLikeUser, eraId: string): Promise<EraRow | null> {
  const rows = isAdminRole(user.role)
    ? await db
        .select()
        .from(schema.galaxyEras)
        .where(eq(schema.galaxyEras.id, eraId))
        .limit(1)
    : await db
        .select()
        .from(schema.galaxyEras)
        .where(and(eq(schema.galaxyEras.id, eraId), eq(schema.galaxyEras.createdBy, user.id)))
        .limit(1);

  return rows[0] ?? null;
}

export async function getEditableSetting(user: SessionLikeUser, settingId: string): Promise<SettingRow | null> {
  const rows = isAdminRole(user.role)
    ? await db
        .select()
        .from(schema.galaxySettings)
        .where(eq(schema.galaxySettings.id, settingId))
        .limit(1)
    : await db
        .select()
        .from(schema.galaxySettings)
        .where(and(eq(schema.galaxySettings.id, settingId), eq(schema.galaxySettings.createdBy, user.id)))
        .limit(1);

  return rows[0] ?? null;
}

export async function getEditableMarker(user: SessionLikeUser, markerId: string): Promise<MarkerRow | null> {
  const rows = isAdminRole(user.role)
    ? await db
        .select()
        .from(schema.galaxyMarkers)
        .where(eq(schema.galaxyMarkers.id, markerId))
        .limit(1)
    : await db
        .select()
        .from(schema.galaxyMarkers)
        .where(and(eq(schema.galaxyMarkers.id, markerId), eq(schema.galaxyMarkers.createdBy, user.id)))
        .limit(1);

  return rows[0] ?? null;
}

export async function worldExists(worldId: string): Promise<boolean> {
  const rows = await db
    .select({ id: schema.galaxyWorlds.id })
    .from(schema.galaxyWorlds)
    .where(eq(schema.galaxyWorlds.id, worldId))
    .limit(1);
  return rows.length > 0;
}

export async function eraExists(eraId: string): Promise<boolean> {
  const rows = await db
    .select({ id: schema.galaxyEras.id })
    .from(schema.galaxyEras)
    .where(eq(schema.galaxyEras.id, eraId))
    .limit(1);
  return rows.length > 0;
}

export async function settingExists(settingId: string): Promise<boolean> {
  const rows = await db
    .select({ id: schema.galaxySettings.id })
    .from(schema.galaxySettings)
    .where(eq(schema.galaxySettings.id, settingId))
    .limit(1);
  return rows.length > 0;
}

export async function markerExists(markerId: string): Promise<boolean> {
  const rows = await db
    .select({ id: schema.galaxyMarkers.id })
    .from(schema.galaxyMarkers)
    .where(eq(schema.galaxyMarkers.id, markerId))
    .limit(1);
  return rows.length > 0;
}

export async function getNextEraOrderIndex(worldId: string): Promise<number> {
  const rows = await db
    .select({ orderIndex: schema.galaxyEras.orderIndex })
    .from(schema.galaxyEras)
    .where(eq(schema.galaxyEras.worldId, worldId))
    .orderBy(desc(schema.galaxyEras.orderIndex))
    .limit(1);

  return (rows[0]?.orderIndex ?? -1) + 1;
}

export function serializeWorld(row: WorldRow, user?: SessionLikeUser) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isFree: row.isFree,
    isPublished: row.isPublished,
    canEdit: user ? canEditGalaxyRow(user, row.createdBy) : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function serializeEra(row: EraRow, user?: SessionLikeUser) {
  return {
    id: row.id,
    worldId: row.worldId,
    name: row.name,
    description: row.description,
    startYear: row.startYear,
    endYear: row.endYear,
    colorHex: row.colorHex,
    orderIndex: row.orderIndex,
    canEdit: user ? canEditGalaxyRow(user, row.createdBy) : undefined,
  };
}

export function serializeSetting(row: SettingRow, user?: SessionLikeUser) {
  return {
    id: row.id,
    worldId: row.worldId,
    eraId: row.eraId,
    name: row.name,
    description: row.description,
    startYear: row.startYear,
    endYear: row.endYear,
    colorHex: row.colorHex,
    canEdit: user ? canEditGalaxyRow(user, row.createdBy) : undefined,
  };
}

export function serializeMarker(row: MarkerRow, user?: SessionLikeUser) {
  return {
    id: row.id,
    worldId: row.worldId,
    eraId: row.eraId,
    settingId: row.settingId,
    name: row.name,
    description: row.description,
    year: row.year,
    category: row.category,
    visibility: row.visibility as GalaxyVisibility,
    canEdit: user ? canEditGalaxyRow(user, row.createdBy) : undefined,
  };
}
