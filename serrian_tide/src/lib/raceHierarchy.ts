export type RaceHierarchySource = {
  id: string;
  name: string;
  parentRaceId?: string | null;
};

export type RaceHierarchyMeta = {
  masterRaceId: string;
  masterRaceLabel: string;
  lineageDepth: number;
  lineagePath: string[];
  hasLineageCycle: boolean;
};

function normalizedRaceName(name: string | null | undefined): string {
  const trimmed = String(name ?? "").trim();
  return trimmed || "Unnamed Race";
}

export function buildRaceHierarchyMetaMap(
  races: RaceHierarchySource[]
): Map<string, RaceHierarchyMeta> {
  const byId = new Map<string, RaceHierarchySource>();
  for (const race of races) {
    byId.set(race.id, race);
  }

  const metaById = new Map<string, RaceHierarchyMeta>();

  for (const race of races) {
    const selfName = normalizedRaceName(race.name);
    const lineageIdsFromSelf: string[] = [];
    const visited = new Set<string>();
    let currentId: string | null = race.id;
    let hasLineageCycle = false;

    while (currentId) {
      if (visited.has(currentId)) {
        hasLineageCycle = true;
        break;
      }

      visited.add(currentId);
      const currentRace = byId.get(currentId);
      if (!currentRace) {
        break;
      }

      lineageIdsFromSelf.push(currentId);
      const nextParentId = currentRace.parentRaceId ?? null;
      if (!nextParentId || !byId.has(nextParentId) || nextParentId === currentId) {
        if (nextParentId === currentId) {
          hasLineageCycle = true;
        }
        break;
      }

      currentId = nextParentId;
    }

    if (hasLineageCycle || lineageIdsFromSelf.length === 0) {
      metaById.set(race.id, {
        masterRaceId: race.id,
        masterRaceLabel: selfName,
        lineageDepth: 0,
        lineagePath: [selfName],
        hasLineageCycle: true,
      });
      continue;
    }

    const lineageIds = lineageIdsFromSelf.reverse();
    const lineagePath = lineageIds.map((id) => normalizedRaceName(byId.get(id)?.name));
    const masterRaceId = lineageIds[0] ?? race.id;
    const masterRaceLabel = lineagePath[0] ?? selfName;

    metaById.set(race.id, {
      masterRaceId,
      masterRaceLabel,
      lineageDepth: Math.max(lineageIds.length - 1, 0),
      lineagePath,
      hasLineageCycle: false,
    });
  }

  return metaById;
}

export function wouldCreateRaceCycle(
  races: Array<{ id: string; parentRaceId: string | null }>,
  raceId: string,
  parentRaceId: string | null
): boolean {
  if (!parentRaceId) return false;
  if (parentRaceId === raceId) return true;

  const parentById = new Map<string, string | null>();
  for (const race of races) {
    parentById.set(race.id, race.parentRaceId);
  }
  parentById.set(raceId, parentRaceId);

  const visited = new Set<string>();
  let current: string | null = parentRaceId;

  while (current) {
    if (current === raceId) return true;
    if (visited.has(current)) return true;
    visited.add(current);
    current = parentById.get(current) ?? null;
  }

  return false;
}
