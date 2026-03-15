export type RaceHierarchySource = {
  id: string;
  name: string;
  parentRaceId?: string | null;
  parent2RaceId?: string | null;
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
  races: Array<{ id: string; parentRaceId: string | null; parent2RaceId?: string | null }>,
  raceId: string,
  parentRaceId: string | null,
  parent2RaceId: string | null
): boolean {
  if (!parentRaceId && !parent2RaceId) return false;
  if (parentRaceId === raceId || parent2RaceId === raceId) return true;
  if (parentRaceId && parent2RaceId && parentRaceId === parent2RaceId) return true;

  const parentsById = new Map<string, { primary: string | null; secondary: string | null }>();
  for (const race of races) {
    parentsById.set(race.id, {
      primary: race.parentRaceId ?? null,
      secondary: race.parent2RaceId ?? null,
    });
  }
  parentsById.set(raceId, { primary: parentRaceId, secondary: parent2RaceId });

  const reachesRace = (startId: string | null): boolean => {
    if (!startId) return false;
    const visited = new Set<string>();
    const queue: string[] = [startId];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      if (current === raceId) return true;
      if (visited.has(current)) continue;

      visited.add(current);
      const parents = parentsById.get(current);
      if (!parents) continue;
      if (parents.primary) queue.push(parents.primary);
      if (parents.secondary) queue.push(parents.secondary);
    }

    return false;
  };

  if (reachesRace(parentRaceId)) return true;
  if (reachesRace(parent2RaceId)) return true;

  return false;
}
