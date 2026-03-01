import { getRoleCapabilities } from "@/lib/authorization";

export const PLAYGROUND_V1_NODE_TYPES = [
  "cosmos",
  "world",
  "era",
  "setting",
  "folder",
  "page",
] as const;

export type PlaygroundV1NodeType = (typeof PLAYGROUND_V1_NODE_TYPES)[number];
export type PlaygroundNodeType = PlaygroundV1NodeType | string;

export const PLAYGROUND_TOOLBOX_TYPES = [
  "race",
  "creature",
  "npc",
  "calendar",
] as const;

export type PlaygroundToolboxType = (typeof PLAYGROUND_TOOLBOX_TYPES)[number];

export function canUsePlayground(role: string | null | undefined): boolean {
  return getRoleCapabilities(role).canWorldBuild;
}

export function getAllowedChildTypes(
  parentType: string | null | undefined
): PlaygroundV1NodeType[] {
  if (!parentType) return ["cosmos"];

  switch (parentType) {
    case "cosmos":
      return ["world"];
    case "world":
      return ["era"];
    case "era":
      return ["setting"];
    case "setting":
      return ["folder", "page"];
    case "folder":
      return ["folder", "page"];
    default:
      return [];
  }
}

export function isPlaygroundNodeType(type: string): type is PlaygroundV1NodeType {
  return PLAYGROUND_V1_NODE_TYPES.includes(type as PlaygroundV1NodeType);
}

export function normalizeTags(input: unknown): string[] {
  if (Array.isArray(input)) {
    return uniqueStrings(
      input
        .filter((item): item is string => typeof item === "string")
        .map((s) => s.trim())
        .filter(Boolean)
    );
  }

  if (typeof input === "string") {
    return uniqueStrings(
      input
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
  }

  return [];
}

export function uniqueStrings(items: string[]): string[] {
  return [...new Set(items)];
}

export function normalizeToolboxLinks(input: unknown): Record<PlaygroundToolboxType, string[]> {
  const result: Record<PlaygroundToolboxType, string[]> = {
    race: [],
    creature: [],
    npc: [],
    calendar: [],
  };

  if (!input || typeof input !== "object") {
    return result;
  }

  for (const toolboxType of PLAYGROUND_TOOLBOX_TYPES) {
    const rawValue = (input as Record<string, unknown>)[toolboxType];
    if (!Array.isArray(rawValue)) continue;

    result[toolboxType] = uniqueStrings(
      rawValue
        .filter((item): item is string => typeof item === "string")
        .map((id) => id.trim())
        .filter(Boolean)
    );
  }

  return result;
}
