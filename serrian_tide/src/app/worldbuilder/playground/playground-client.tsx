"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { GradientText } from "@/components/GradientText";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { Tabs } from "@/components/Tabs";
import { getAllowedChildTypes, PLAYGROUND_TOOLBOX_TYPES, type PlaygroundToolboxType } from "@/lib/playground";

type PlaygroundNode = {
  id: string;
  createdBy: string;
  type: string;
  parentId: string | null;
  sortOrder: number;
  name: string;
  summary: string | null;
  tags: string[] | null;
  markdown: string | null;
  meta: Record<string, unknown> | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type PlaygroundTreeNode = PlaygroundNode & {
  children: PlaygroundTreeNode[];
};

type ToolboxItem = {
  id: string;
  name: string;
  detail: string;
};

type LinksMap = Record<PlaygroundToolboxType, string[]>;

type PlaygroundClientProps = {
  user: {
    id: string;
    username: string;
    role: string;
  };
};

const NODE_TYPE_LABELS: Record<string, string> = {
  cosmos: "Cosmos",
  world: "World",
  era: "Era",
  setting: "Setting",
  folder: "Folder",
  page: "Page",
};

const TOOLBOX_LABELS: Record<PlaygroundToolboxType, string> = {
  race: "Races",
  creature: "Creatures",
  npc: "NPCs",
  calendar: "Calendars",
};

function emptyLinks(): LinksMap {
  return {
    race: [],
    creature: [],
    npc: [],
    calendar: [],
  };
}

function toStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is string => typeof item === "string");
}

function coerceLinks(input: unknown): LinksMap {
  const defaults = emptyLinks();
  if (!input || typeof input !== "object") return defaults;

  const value = input as Record<string, unknown>;
  return {
    race: toStringArray(value.race),
    creature: toStringArray(value.creature),
    npc: toStringArray(value.npc),
    calendar: toStringArray(value.calendar),
  };
}

function filterTree(nodes: PlaygroundTreeNode[], query: string): PlaygroundTreeNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  const recurse = (items: PlaygroundTreeNode[]): PlaygroundTreeNode[] => {
    const result: PlaygroundTreeNode[] = [];

    for (const item of items) {
      const tagText = (item.tags ?? []).join(" ").toLowerCase();
      const nameMatches = item.name.toLowerCase().includes(q);
      const tagsMatch = tagText.includes(q);
      const filteredChildren = recurse(item.children ?? []);

      if (nameMatches || tagsMatch || filteredChildren.length > 0) {
        result.push({ ...item, children: filteredChildren });
      }
    }

    return result;
  };

  return recurse(nodes);
}

function findNearestSettingId(
  nodeId: string | null,
  byId: Record<string, PlaygroundNode>
): string | null {
  if (!nodeId) return null;

  let cursor: string | null = nodeId;
  while (cursor) {
    const node: PlaygroundNode | undefined = byId[cursor];
    if (!node) return null;
    if (node.type === "setting") return node.id;
    cursor = node.parentId;
  }

  return null;
}

function buildToolboxSnapshotMarkdown(
  settingName: string,
  links: LinksMap,
  toolboxData: Record<PlaygroundToolboxType, ToolboxItem[]>
): string {
  const sections: string[] = [
    `## Toolbox Snapshot (${settingName})`,
    "",
    "Generated from attached toolbox assets.",
  ];

  for (const toolboxType of PLAYGROUND_TOOLBOX_TYPES) {
    const ids = links[toolboxType];
    if (ids.length === 0) continue;

    const byId = new Map(toolboxData[toolboxType].map((item) => [item.id, item]));
    sections.push("", `### ${TOOLBOX_LABELS[toolboxType]}`);

    for (const id of ids) {
      const item = byId.get(id);
      if (!item) continue;
      sections.push(`- **${item.name}**${item.detail ? ` - ${item.detail}` : ""}`);
    }
  }

  return sections.join("\n");
}

function getAttachedItems(
  links: LinksMap,
  toolboxData: Record<PlaygroundToolboxType, ToolboxItem[]>
): Record<PlaygroundToolboxType, ToolboxItem[]> {
  const result: Record<PlaygroundToolboxType, ToolboxItem[]> = {
    race: [],
    creature: [],
    npc: [],
    calendar: [],
  };

  for (const toolboxType of PLAYGROUND_TOOLBOX_TYPES) {
    const byId = new Map(toolboxData[toolboxType].map((item) => [item.id, item]));
    result[toolboxType] = links[toolboxType]
      .map((id) => byId.get(id))
      .filter((item): item is ToolboxItem => Boolean(item));
  }

  return result;
}

function renderMarkdown(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const elements: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (line.trim().startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !(lines[index] ?? "").trim().startsWith("```")) {
        codeLines.push(lines[index] ?? "");
        index += 1;
      }
      elements.push(
        <pre
          key={`code-${index}`}
          className="rounded-xl border border-white/10 bg-black/30 p-3 overflow-x-auto text-xs text-amber-100"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      index += 1;
      continue;
    }

    if (/^###\s+/.test(line)) {
      elements.push(
        <h3 key={`h3-${index}`} className="text-lg font-semibold text-amber-100 mt-4">
          {line.replace(/^###\s+/, "")}
        </h3>
      );
      index += 1;
      continue;
    }

    if (/^##\s+/.test(line)) {
      elements.push(
        <h2 key={`h2-${index}`} className="text-xl font-semibold text-amber-100 mt-4">
          {line.replace(/^##\s+/, "")}
        </h2>
      );
      index += 1;
      continue;
    }

    if (/^#\s+/.test(line)) {
      elements.push(
        <h1 key={`h1-${index}`} className="text-2xl font-semibold text-amber-100 mt-4">
          {line.replace(/^#\s+/, "")}
        </h1>
      );
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^[-*]\s+/, ""));
        index += 1;
      }
      elements.push(
        <ul key={`ul-${index}`} className="list-disc pl-6 text-zinc-200 space-y-1">
          {items.map((item, itemIdx) => (
            <li key={`li-${index}-${itemIdx}`}>{item}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (line.trim().length === 0) {
      elements.push(<div key={`spacer-${index}`} className="h-2" />);
      index += 1;
      continue;
    }

    elements.push(
      <p key={`p-${index}`} className="text-zinc-200 leading-relaxed">
        {line}
      </p>
    );
    index += 1;
  }

  return elements;
}

function TreeItem({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: PlaygroundTreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const selected = selectedId === node.id;

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={[
          "w-full rounded-lg border px-3 py-2 text-left transition",
          selected
            ? "border-violet-400/50 bg-violet-400/10"
            : "border-white/10 bg-black/20 hover:bg-white/5",
        ].join(" ")}
        style={{ marginLeft: `${depth * 14}px`, width: `calc(100% - ${depth * 14}px)` }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-zinc-100 truncate">{node.name}</span>
          <span className="text-[10px] uppercase tracking-wide text-zinc-400">{node.type}</span>
        </div>
      </button>

      {node.children.length > 0 && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ToolboxMultiSelect({
  type,
  options,
  selectedIds,
  query,
  onQueryChange,
  onToggle,
}: {
  type: PlaygroundToolboxType;
  options: ToolboxItem[];
  selectedIds: string[];
  query: string;
  onQueryChange: (value: string) => void;
  onToggle: (id: string) => void;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((item) => {
      const haystack = `${item.name} ${item.detail}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [options, query]);

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-100">{TOOLBOX_LABELS[type]}</p>
        <p className="text-xs text-zinc-400">
          {selectedIds.length} selected / {options.length}
        </p>
      </div>

      <Input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={`Search ${TOOLBOX_LABELS[type].toLowerCase()}...`}
        className="mb-2"
      />

      <div className="max-h-44 overflow-auto space-y-1 pr-1">
        {filtered.length === 0 && (
          <p className="text-xs text-zinc-500">No matches.</p>
        )}

        {filtered.map((item) => {
          const checked = selectedIds.includes(item.id);
          return (
            <label
              key={item.id}
              className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-2 hover:bg-white/10"
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={checked}
                onChange={() => onToggle(item.id)}
              />
              <span className="min-w-0">
                <span className="block text-xs text-zinc-100 truncate">{item.name}</span>
                {item.detail && <span className="block text-[11px] text-zinc-400 truncate">{item.detail}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function PlaygroundClient({ user }: PlaygroundClientProps) {
  const [tree, setTree] = useState<PlaygroundTreeNode[]>([]);
  const [nodes, setNodes] = useState<PlaygroundNode[]>([]);
  const [linksByNode, setLinksByNode] = useState<Record<string, LinksMap>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [treeSearch, setTreeSearch] = useState("");
  const [loadingTree, setLoadingTree] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"details" | "content" | "preview">("details");
  const [nameInput, setNameInput] = useState("");
  const [summaryInput, setSummaryInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [sortOrderInput, setSortOrderInput] = useState("0");
  const [isPublishedInput, setIsPublishedInput] = useState(false);
  const [markdownInput, setMarkdownInput] = useState("");

  const [creatingType, setCreatingType] = useState<string | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingContent, setSavingContent] = useState(false);
  const [deletingNode, setDeletingNode] = useState(false);

  const [toolboxData, setToolboxData] = useState<Record<PlaygroundToolboxType, ToolboxItem[]>>({
    race: [],
    creature: [],
    npc: [],
    calendar: [],
  });
  const [toolboxLoaded, setToolboxLoaded] = useState(false);
  const [toolboxLoading, setToolboxLoading] = useState(false);
  const [toolboxSearch, setToolboxSearch] = useState<Record<PlaygroundToolboxType, string>>({
    race: "",
    creature: "",
    npc: "",
    calendar: "",
  });
  const [settingLinks, setSettingLinks] = useState<LinksMap>(emptyLinks());
  const [loadingSettingLinks, setLoadingSettingLinks] = useState(false);
  const [savingSettingLinks, setSavingSettingLinks] = useState(false);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const filteredTree = useMemo(() => filterTree(tree, treeSearch), [tree, treeSearch]);

  const availableCreateTypes = useMemo(() => {
    return selectedNode ? getAllowedChildTypes(selectedNode.type) : getAllowedChildTypes(null);
  }, [selectedNode]);

  const selectedSetting = selectedNode?.type === "setting" ? selectedNode : null;
  const nodesById = useMemo(() => {
    return nodes.reduce<Record<string, PlaygroundNode>>((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {});
  }, [nodes]);
  const activeSettingId = useMemo(() => {
    return findNearestSettingId(selectedNodeId, nodesById);
  }, [selectedNodeId, nodesById]);
  const activeSettingNode = activeSettingId ? nodesById[activeSettingId] ?? null : null;
  const activeSettingLinks = useMemo(() => {
    if (selectedSetting) return settingLinks;
    if (!activeSettingId) return emptyLinks();
    return coerceLinks(linksByNode[activeSettingId]);
  }, [selectedSetting, settingLinks, activeSettingId, linksByNode]);
  const activeAttachedItems = useMemo(() => {
    return getAttachedItems(activeSettingLinks, toolboxData);
  }, [activeSettingLinks, toolboxData]);

  const fetchTree = useCallback(async () => {
    try {
      setLoadingTree(true);
      setTreeError(null);

      const response = await fetch("/api/worldbuilder/playground/tree", { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as
        | {
            ok: boolean;
            tree?: PlaygroundTreeNode[];
            nodes?: PlaygroundNode[];
            linksByNode?: Record<string, unknown>;
            error?: string;
          }
        | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to load playground tree");
      }

      const nextTree = Array.isArray(data.tree) ? data.tree : [];
      const nextNodes = Array.isArray(data.nodes) ? data.nodes : [];
      const nextLinksByNode: Record<string, LinksMap> = {};

      if (data.linksByNode && typeof data.linksByNode === "object") {
        for (const [nodeId, links] of Object.entries(data.linksByNode)) {
          nextLinksByNode[nodeId] = coerceLinks(links);
        }
      }

      setTree(nextTree);
      setNodes(nextNodes);
      setLinksByNode(nextLinksByNode);
      setSelectedNodeId((current) => {
        if (current && nextNodes.some((n) => n.id === current)) return current;
        return nextNodes[0]?.id ?? null;
      });
    } catch (err) {
      console.error(err);
      setTreeError(err instanceof Error ? err.message : "Failed to load playground tree");
    } finally {
      setLoadingTree(false);
    }
  }, []);

  const loadToolboxData = useCallback(async () => {
    try {
      setToolboxLoading(true);

      const [racesRes, creaturesRes, npcsRes, calendarsRes] = await Promise.all([
        fetch("/api/worldbuilder/races", { cache: "no-store" }),
        fetch("/api/worldbuilder/creatures", { cache: "no-store" }),
        fetch("/api/worldbuilder/npcs", { cache: "no-store" }),
        fetch("/api/worldbuilder/calendars", { cache: "no-store" }),
      ]);

      const [racesData, creaturesData, npcsData, calendarsData] = await Promise.all([
        racesRes.json().catch(() => ({})),
        creaturesRes.json().catch(() => ({})),
        npcsRes.json().catch(() => ({})),
        calendarsRes.json().catch(() => ({})),
      ]);

      const races = Array.isArray((racesData as { races?: unknown[] }).races)
        ? ((racesData as { races: Array<{ id: string; name: string; tagline?: string | null }> }).races ?? [])
        : [];
      const creatures = Array.isArray((creaturesData as { creatures?: unknown[] }).creatures)
        ? ((creaturesData as { creatures: Array<{ id: string; name: string; challengeRating?: string | null }> })
            .creatures ?? [])
        : [];
      const npcs = Array.isArray((npcsData as { npcs?: unknown[] }).npcs)
        ? ((npcsData as { npcs: Array<{ id: string; name: string; role?: string | null; location?: string | null }> })
            .npcs ?? [])
        : [];
      const calendars = Array.isArray((calendarsData as { calendars?: unknown[] }).calendars)
        ? ((calendarsData as { calendars: Array<{ id: string; name: string; description?: string | null }> })
            .calendars ?? [])
        : [];

      setToolboxData({
        race: races.map((race) => ({
          id: race.id,
          name: race.name,
          detail: race.tagline || "",
        })),
        creature: creatures.map((creature) => ({
          id: creature.id,
          name: creature.name,
          detail: creature.challengeRating ? `CR ${creature.challengeRating}` : "",
        })),
        npc: npcs.map((npc) => ({
          id: npc.id,
          name: npc.name,
          detail: [npc.role, npc.location].filter(Boolean).join(" | "),
        })),
        calendar: calendars.map((calendar) => ({
          id: calendar.id,
          name: calendar.name,
          detail: calendar.description || "",
        })),
      });

      setToolboxLoaded(true);
    } catch (err) {
      console.error("Failed to load toolbox data:", err);
    } finally {
      setToolboxLoading(false);
    }
  }, []);

  const loadSettingLinks = useCallback(async (nodeId: string) => {
    try {
      setLoadingSettingLinks(true);
      setSettingLinks(coerceLinks(linksByNode[nodeId]));

      const response = await fetch(`/api/worldbuilder/playground/node/${nodeId}/toolbox-links`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | { ok: boolean; links?: unknown; error?: string }
        | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to load setting links");
      }

      setSettingLinks(coerceLinks(data.links));
    } catch (err) {
      console.error("Failed to load setting links:", err);
      setSettingLinks(emptyLinks());
    } finally {
      setLoadingSettingLinks(false);
    }
  }, [linksByNode]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  useEffect(() => {
    if (!selectedNode) {
      setNameInput("");
      setSummaryInput("");
      setTagsInput("");
      setSortOrderInput("0");
      setIsPublishedInput(false);
      setMarkdownInput("");
      return;
    }

    setNameInput(selectedNode.name);
    setSummaryInput(selectedNode.summary ?? "");
    setTagsInput((selectedNode.tags ?? []).join(", "));
    setSortOrderInput(String(selectedNode.sortOrder ?? 0));
    setIsPublishedInput(Boolean(selectedNode.isPublished));
    setMarkdownInput(selectedNode.markdown ?? "");
  }, [selectedNode]);

  useEffect(() => {
    if (activeSettingId && !toolboxLoaded) {
      loadToolboxData();
    }
  }, [activeSettingId, toolboxLoaded, loadToolboxData]);

  useEffect(() => {
    if (!selectedSetting) {
      setSettingLinks(emptyLinks());
      return;
    }
    loadSettingLinks(selectedSetting.id);
  }, [selectedSetting, loadSettingLinks]);

  const createNodeRequest = useCallback(
    async (type: string, name: string, parentId: string | null): Promise<PlaygroundNode> => {
      const response = await fetch("/api/worldbuilder/playground/node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          type,
          name,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok: boolean; node?: PlaygroundNode; error?: string }
        | null;

      if (!response.ok || !data?.ok || !data.node) {
        throw new Error(data?.error || "Failed to create node");
      }

      return data.node;
    },
    []
  );

  const handleCreateNode = async (type: string) => {
    const nextName = window.prompt(`Name for new ${NODE_TYPE_LABELS[type] ?? type}:`);
    if (!nextName || nextName.trim().length === 0) return;

    try {
      setCreatingType(type);
      const node = await createNodeRequest(type, nextName.trim(), selectedNode?.id ?? null);
      await fetchTree();
      setSelectedNodeId(node.id);
      setActiveTab("details");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to create node");
    } finally {
      setCreatingType(null);
    }
  };

  const handleQuickScaffold = async () => {
    const base = window.prompt("Base name for scaffold (example: Aetherion):");
    if (!base || base.trim().length === 0) return;
    const seed = base.trim();

    try {
      setCreatingType("scaffold");
      const cosmos = await createNodeRequest("cosmos", `${seed} Cosmos`, null);
      const world = await createNodeRequest("world", `${seed} World`, cosmos.id);
      const era = await createNodeRequest("era", `${seed} Era`, world.id);
      const setting = await createNodeRequest("setting", `${seed} Setting`, era.id);

      await fetchTree();
      setSelectedNodeId(setting.id);
      setActiveTab("details");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to build scaffold");
    } finally {
      setCreatingType(null);
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedNode) return;

    const parsedSortOrder = Number.parseInt(sortOrderInput, 10);
    if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
      alert("Sort order must be a non-negative integer.");
      return;
    }

    try {
      setSavingDetails(true);
      const response = await fetch(`/api/worldbuilder/playground/node/${selectedNode.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput,
          summary: summaryInput,
          tags: tagsInput,
          sortOrder: parsedSortOrder,
          isPublished: isPublishedInput,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to save details");
      }

      await fetchTree();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to save details");
    } finally {
      setSavingDetails(false);
    }
  };

  const handleSaveContent = async () => {
    if (!selectedNode) return;

    try {
      setSavingContent(true);
      const response = await fetch(`/api/worldbuilder/playground/node/${selectedNode.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: markdownInput,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to save markdown");
      }

      await fetchTree();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to save markdown");
    } finally {
      setSavingContent(false);
    }
  };

  const handleInsertToolboxSnapshot = () => {
    if (!activeSettingNode) return;

    const snapshot = buildToolboxSnapshotMarkdown(
      activeSettingNode.name,
      activeSettingLinks,
      toolboxData
    );

    setMarkdownInput((current) => {
      const prefix = current.trim().length > 0 ? `${current}\n\n` : "";
      return `${prefix}${snapshot}`;
    });
    setActiveTab("content");
  };

  const handleDeleteNode = async () => {
    if (!selectedNode) return;
    const confirmed = window.confirm(
      `Delete "${selectedNode.name}" and all children? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingNode(true);
      const response = await fetch(`/api/worldbuilder/playground/node/${selectedNode.id}`, {
        method: "DELETE",
      });

      const data = (await response.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to delete node");
      }

      setSelectedNodeId(null);
      await fetchTree();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to delete node");
    } finally {
      setDeletingNode(false);
    }
  };

  const toggleToolboxLink = (toolboxType: PlaygroundToolboxType, toolboxId: string) => {
    setSettingLinks((current) => {
      const values = current[toolboxType];
      const exists = values.includes(toolboxId);
      return {
        ...current,
        [toolboxType]: exists
          ? values.filter((id) => id !== toolboxId)
          : [...values, toolboxId],
      };
    });
  };

  const handleSaveSettingLinks = async () => {
    if (!selectedSetting) return;

    try {
      setSavingSettingLinks(true);
      const response = await fetch(
        `/api/worldbuilder/playground/node/${selectedSetting.id}/toolbox-links`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ links: settingLinks }),
        }
      );

      const data = (await response.json().catch(() => null)) as
        | { ok: boolean; links?: unknown; error?: string }
        | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to save toolbox links");
      }

      const normalized = coerceLinks(data.links);
      setSettingLinks(normalized);
      setLinksByNode((current) => ({ ...current, [selectedSetting.id]: normalized }));
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to save toolbox links");
    } finally {
      setSavingSettingLinks(false);
    }
  };

  const totalAttached = useMemo(() => {
    return PLAYGROUND_TOOLBOX_TYPES.reduce((sum, type) => sum + settingLinks[type].length, 0);
  }, [settingLinks]);
  const totalActiveAttached = useMemo(() => {
    return PLAYGROUND_TOOLBOX_TYPES.reduce((sum, type) => sum + activeSettingLinks[type].length, 0);
  }, [activeSettingLinks]);

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10">
      <header className="max-w-[1700px] mx-auto mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <GradientText
            as="h1"
            variant="title"
            glow
            className="font-evanescent text-3xl sm:text-4xl md:text-5xl tracking-tight"
          >
            The G.O.D&apos;s Playground
          </GradientText>
          <p className="mt-1 text-sm text-zinc-300/90">
            Build your cosmos tree, write wiki pages, and attach toolbox assets to settings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-xs text-zinc-400 hidden md:block">
            Logged in as {user.username} ({user.role})
          </p>
          <Link href="/worldbuilder">
            <Button variant="secondary" size="sm">
              Back to Source Forge
            </Button>
          </Link>
        </div>
      </header>

      <section className="max-w-[1700px] mx-auto grid grid-cols-1 xl:grid-cols-[320px,1fr,380px] gap-4">
        <Card
          padded={false}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 shadow-2xl h-fit"
        >
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-zinc-100 mb-2">World Tree</p>
              <Input
                value={treeSearch}
                onChange={(e) => setTreeSearch(e.target.value)}
                placeholder="Search by name or tags..."
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400 mb-2">Create</p>
              <div className="mb-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleQuickScaffold}
                  disabled={creatingType !== null}
                >
                  {creatingType === "scaffold" ? "Scaffolding..." : "Quick Scaffold (Cosmos → Setting)"}
                </Button>
              </div>
              {availableCreateTypes.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  Select a node that can have children, then add worlds/eras/settings/pages.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableCreateTypes.map((type) => (
                    <Button
                      key={type}
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCreateNode(type)}
                      disabled={creatingType !== null}
                    >
                      {creatingType === type ? "Creating..." : `+ ${NODE_TYPE_LABELS[type] ?? type}`}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="max-h-[65vh] overflow-auto space-y-2 pr-1">
              {loadingTree && <p className="text-sm text-zinc-400">Loading tree...</p>}
              {!loadingTree && treeError && (
                <p className="text-sm text-red-300">Failed to load tree: {treeError}</p>
              )}
              {!loadingTree && !treeError && filteredTree.length === 0 && (
                <p className="text-sm text-zinc-500">
                  {tree.length === 0
                    ? "No nodes yet. Create your first cosmos."
                    : "No nodes match your search."}
                </p>
              )}
              {!loadingTree &&
                !treeError &&
                filteredTree.map((node) => (
                  <TreeItem
                    key={node.id}
                    node={node}
                    depth={0}
                    selectedId={selectedNodeId}
                    onSelect={setSelectedNodeId}
                  />
                ))}
            </div>
          </div>
        </Card>

        <Card
          padded={false}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 sm:p-5 shadow-2xl min-h-[70vh]"
        >
          {!selectedNode ? (
            <div className="h-full flex items-center justify-center text-center">
              <p className="text-zinc-400">
                Select a node from the tree, or create a new cosmos to begin.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-100">{selectedNode.name}</h2>
                  <p className="text-xs text-zinc-400 uppercase tracking-wide mt-1">
                    {NODE_TYPE_LABELS[selectedNode.type] ?? selectedNode.type}
                  </p>
                </div>
                <p className="text-xs text-zinc-500">
                  Node ID: <span className="font-mono">{selectedNode.id.slice(0, 8)}</span>
                </p>
              </div>

              <Tabs
                tabs={[
                  { id: "details", label: "Details" },
                  { id: "content", label: "Content" },
                  { id: "preview", label: "Preview" },
                ]}
                activeId={activeTab}
                onChange={(tabId) => setActiveTab(tabId as "details" | "content" | "preview")}
                fullWidth
              />

              {activeTab === "details" && (
                <div className="space-y-4">
                  <FormField label="Name" htmlFor="node-name" required>
                    <Input
                      id="node-name"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Node name"
                    />
                  </FormField>

                  <FormField label="Summary / Description" htmlFor="node-summary">
                    <textarea
                      id="node-summary"
                      value={summaryInput}
                      onChange={(e) => setSummaryInput(e.target.value)}
                      placeholder="High-level summary for this node..."
                      className="w-full rounded-2xl border border-slate-700/70 bg-slate-900/40 text-slate-100 px-4 py-3 min-h-[120px] text-base shadow-inner backdrop-blur placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                    />
                  </FormField>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Tags (comma-separated)" htmlFor="node-tags">
                      <Input
                        id="node-tags"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="city, guild, history, chapter-1"
                      />
                    </FormField>

                    <FormField label="Sort Order" htmlFor="node-sort-order">
                      <Input
                        id="node-sort-order"
                        type="number"
                        min={0}
                        value={sortOrderInput}
                        onChange={(e) => setSortOrderInput(e.target.value)}
                      />
                    </FormField>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-zinc-200">
                    <input
                      type="checkbox"
                      checked={isPublishedInput}
                      onChange={(e) => setIsPublishedInput(e.target.checked)}
                    />
                    Published
                  </label>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveDetails}
                      disabled={savingDetails}
                    >
                      {savingDetails ? "Saving..." : "Save Details"}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleDeleteNode}
                      disabled={deletingNode}
                    >
                      {deletingNode ? "Deleting..." : "Delete Node"}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "content" && (
                <div className="space-y-3">
                  <Card
                    padded={false}
                    className="rounded-xl border border-amber-300/30 bg-amber-300/5 p-4"
                  >
                    <p className="text-sm text-zinc-300">
                      Write markdown notes for this node. For <span className="text-amber-200">Page</span> nodes this
                      is your wiki body; for other node types it can hold planning notes, lore, and structure.
                    </p>
                  </Card>
                  <FormField label="Markdown Content" htmlFor="node-markdown">
                    <textarea
                      id="node-markdown"
                      value={markdownInput}
                      onChange={(e) => setMarkdownInput(e.target.value)}
                      placeholder="Write your content in markdown..."
                      className="w-full rounded-2xl border border-slate-700/70 bg-slate-900/40 text-slate-100 px-4 py-3 min-h-[380px] text-sm font-mono shadow-inner backdrop-blur placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                    />
                  </FormField>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveContent}
                      disabled={savingContent}
                    >
                      {savingContent ? "Saving..." : "Save Content"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleInsertToolboxSnapshot}
                      disabled={!activeSettingNode || totalActiveAttached === 0 || toolboxLoading}
                    >
                      Insert Attached Toolbox Snapshot
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "preview" && (
                <Card
                  padded={false}
                  className="rounded-xl border border-white/10 bg-black/25 p-4 space-y-2"
                >
                  {markdownInput.trim().length > 0 ? (
                    <div className="space-y-2">{renderMarkdown(markdownInput)}</div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-zinc-300">No markdown content yet for this node.</p>
                      {selectedNode.summary && (
                        <p className="text-zinc-400">{selectedNode.summary}</p>
                      )}
                      {activeSettingNode && totalActiveAttached > 0 && (
                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                          <p className="text-xs uppercase tracking-wide text-zinc-400 mb-2">
                            Attached Toolbox ({activeSettingNode.name})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {PLAYGROUND_TOOLBOX_TYPES.map((type) => (
                              <span
                                key={type}
                                className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs text-zinc-300"
                              >
                                {TOOLBOX_LABELS[type]}: {activeSettingLinks[type].length}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}
        </Card>

        <Card
          padded={false}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 shadow-2xl h-fit"
        >
          {!activeSettingNode ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-300 font-medium mb-1">Toolbox Attachments</p>
              <p className="text-xs text-zinc-500">
                Select a <span className="text-amber-200">Setting</span> (or any child under one) to use
                races, creatures, NPCs, and calendars.
              </p>
            </div>
          ) : selectedSetting ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Setting Attachments</p>
                  <p className="text-xs text-zinc-400">{selectedSetting.name}</p>
                </div>
                <p className="text-xs text-zinc-400">{totalAttached} total attached</p>
              </div>

              {(toolboxLoading || loadingSettingLinks) && (
                <p className="text-sm text-zinc-400">Loading attachment data...</p>
              )}

              {!toolboxLoading && (
                <div className="space-y-3">
                  {PLAYGROUND_TOOLBOX_TYPES.map((toolboxType) => (
                    <ToolboxMultiSelect
                      key={toolboxType}
                      type={toolboxType}
                      options={toolboxData[toolboxType]}
                      selectedIds={settingLinks[toolboxType]}
                      query={toolboxSearch[toolboxType]}
                      onQueryChange={(nextValue) =>
                        setToolboxSearch((current) => ({
                          ...current,
                          [toolboxType]: nextValue,
                        }))
                      }
                      onToggle={(toolboxId) => toggleToolboxLink(toolboxType, toolboxId)}
                    />
                  ))}
                </div>
              )}

              <div className="pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={handleSaveSettingLinks}
                  disabled={savingSettingLinks || toolboxLoading}
                >
                  {savingSettingLinks ? "Saving Links..." : "Save Toolbox Links"}
                </Button>
              </div>

              {totalAttached > 0 && (
                <Card padded={false} className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Attached Items Preview</p>
                  {PLAYGROUND_TOOLBOX_TYPES.map((toolboxType) => {
                    const items = activeAttachedItems[toolboxType];
                    if (items.length === 0) return null;
                    return (
                      <div key={toolboxType}>
                        <p className="text-xs text-zinc-300 mb-1">{TOOLBOX_LABELS[toolboxType]} ({items.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {items.slice(0, 8).map((item) => (
                            <span
                              key={item.id}
                              className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-200"
                            >
                              {item.name}
                            </span>
                          ))}
                          {items.length > 8 && (
                            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-400">
                              +{items.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-zinc-200 font-medium">Inherited Setting Attachments</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Current node uses links from setting:{" "}
                  <span className="text-amber-200">{activeSettingNode.name}</span>
                </p>
                <div className="mt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedNodeId(activeSettingNode.id)}
                  >
                    Open Setting Attachments
                  </Button>
                </div>
              </div>

              {totalActiveAttached === 0 ? (
                <p className="text-xs text-zinc-500">No toolbox assets attached to this setting yet.</p>
              ) : (
                <Card padded={false} className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Available Toolbox for This Node</p>
                  {PLAYGROUND_TOOLBOX_TYPES.map((toolboxType) => {
                    const items = activeAttachedItems[toolboxType];
                    if (items.length === 0) return null;
                    return (
                      <div key={toolboxType}>
                        <p className="text-xs text-zinc-300 mb-1">{TOOLBOX_LABELS[toolboxType]} ({items.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {items.slice(0, 10).map((item) => (
                            <span
                              key={item.id}
                              className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-200"
                            >
                              {item.name}
                            </span>
                          ))}
                          {items.length > 10 && (
                            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-400">
                              +{items.length - 10} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              )}
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
