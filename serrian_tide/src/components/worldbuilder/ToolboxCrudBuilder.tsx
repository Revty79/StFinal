"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { GradientText } from "@/components/GradientText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { Input } from "@/components/Input";
import { Tabs } from "@/components/Tabs";
import { WBNav, type WBNavKey } from "@/components/worldbuilder/WBNav";

type BuilderTab = "library" | "edit" | "preview";

export type ToolRecord = {
  id: string | number;
  name: string;
  tagline?: string | null;
  data?: Record<string, any> | null;
  isFree?: boolean;
  isPublished?: boolean;
  canEdit?: boolean;
  createdBy?: string | null;
};

type ToolFieldKind = "text" | "csv" | "table" | "select";

export type ToolFieldVisibility = {
  fieldKey: string;
  equals?: string;
  oneOf?: string[];
};

export type ToolSelectOption = {
  value: string;
  label: string;
};

export type ToolFieldRelation = {
  endpoint: string;
  listKey: string;
  label?: string;
  multi?: boolean;
  excludeCurrentItem?: boolean;
  filterOptions?: (option: ToolRecord, current: ToolRecord | null) => boolean;
  onSelectPopulate?: (option: ToolRecord, current: ToolRecord | null) => Record<string, unknown>;
};

export type ToolField = {
  key: string;
  label: string;
  kind?: ToolFieldKind;
  description?: string;
  placeholder?: string;
  rows?: number;
  tableColumns?: string[];
  options?: Array<string | ToolSelectOption>;
  visibleWhen?: ToolFieldVisibility;
  relation?: ToolFieldRelation;
};

export type ToolFieldGroup = {
  title: string;
  description?: string;
  fields: ToolField[];
};

export type ToolboxTheme = {
  activeCardClass?: string;
  panelClass?: string;
  sectionClass?: string;
  badgeClass?: string;
};

export type RelatedToolLink = {
  label: string;
  href: string;
  note?: string;
};

export type BuilderCue = {
  title: string;
  text: string;
};

export type ToolPreset = {
  label: string;
  summary?: string;
  name?: string;
  tagline?: string;
  data?: Record<string, any>;
  isFree?: boolean;
  isPublished?: boolean;
};

export type PreviewHighlight = {
  label: string;
  key: string;
  kind?: ToolFieldKind;
  fallback?: string;
};

type BuilderLayoutVariant = "atlas" | "ledger" | "forge";

type CreateFromSelectedConfig = {
  label?: string;
  build: (selected: ToolRecord, allItems: ToolRecord[]) => Partial<ToolRecord>;
};

type ToolboxCrudBuilderProps = {
  navKey: WBNavKey;
  title: string;
  description: string;
  endpoint: string;
  listKey: string;
  itemKey: string;
  singularLabel: string;
  pluralLabel: string;
  fields?: ToolField[];
  fieldGroups?: ToolFieldGroup[];
  theme?: ToolboxTheme;
  flavorLine?: string;
  relatedTools?: RelatedToolLink[];
  designCues?: BuilderCue[];
  presets?: ToolPreset[];
  previewHighlights?: PreviewHighlight[];
  renderPreview?: (entry: ToolRecord) => ReactNode;
  tabLabels?: Partial<Record<BuilderTab, string>>;
  editHint?: string;
  layoutVariant?: BuilderLayoutVariant;
  workspaceLabel?: string;
  createFromSelected?: CreateFromSelectedConfig;
};

const DEFAULT_TABS: { id: BuilderTab; label: string }[] = [
  { id: "library", label: "Library" },
  { id: "edit", label: "Edit" },
  { id: "preview", label: "Preview" },
];

const DEFAULT_LAYOUT_BY_NAV: Partial<Record<WBNavKey, BuilderLayoutVariant>> = {
  geography: "atlas",
  settlements: "forge",
  factions: "ledger",
  cultures: "atlas",
  economy: "ledger",
  encounters: "forge",
  dungeons: "forge",
  "plot-hooks": "atlas",
  timeline: "ledger",
  pantheon: "atlas",
};

const uid = () => Math.random().toString(36).slice(2, 10);

function isLocalId(value: ToolRecord["id"]): value is string {
  return typeof value === "string" && value.length < 20;
}

function parseCsv(raw: string): string[] | null {
  const items = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : null;
}

function formatCsv(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value.filter((v): v is string => typeof v === "string").join(", ");
}

function parseTable(raw: string, columns: string[]): Array<Record<string, string>> | null {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const rows = lines
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      const row: Record<string, string> = {};
      columns.forEach((col, idx) => {
        row[col] = parts[idx] ?? "";
      });
      return row;
    })
    .filter((row) => Object.values(row).some((v) => v.length > 0));

  return rows.length > 0 ? rows : null;
}

function formatTable(value: unknown, columns: string[]): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((row) => {
      if (!row || typeof row !== "object") return "";
      const obj = row as Record<string, unknown>;
      return columns.map((col) => String(obj[col] ?? "")).join(" | ");
    })
    .filter(Boolean)
    .join("\n");
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function formatPreviewValue(
  value: unknown,
  kind: ToolFieldKind,
  tableColumns: string[] = []
): string {
  if (kind === "csv") return formatCsv(value) || "None";
  if (kind === "table") return formatTable(value, tableColumns) || "No entries";
  if (typeof value === "string") return value.trim() || "Not set";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "None";
  if (value && typeof value === "object") return JSON.stringify(value);
  return "Not set";
}

export function ToolboxCrudBuilder({
  navKey,
  title,
  description,
  endpoint,
  listKey,
  itemKey,
  singularLabel,
  pluralLabel,
  fields,
  fieldGroups,
  theme,
  flavorLine,
  relatedTools,
  designCues,
  presets,
  previewHighlights,
  renderPreview,
  tabLabels,
  editHint,
  layoutVariant,
  workspaceLabel,
  createFromSelected,
}: ToolboxCrudBuilderProps) {
  const [items, setItems] = useState<ToolRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qtext, setQtext] = useState("");
  const [activeTab, setActiveTab] = useState<BuilderTab>("library");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [relationData, setRelationData] = useState<Record<string, ToolRecord[]>>({});
  const [relationSearch, setRelationSearch] = useState<Record<string, string>>({});

  const selected = useMemo(
    () => items.find((item) => String(item.id) === String(selectedId ?? "")) ?? null,
    [items, selectedId]
  );

  const effectiveFieldGroups = useMemo<ToolFieldGroup[]>(() => {
    if (fieldGroups && fieldGroups.length > 0) return fieldGroups;
    return [{ title: "Details", fields: fields ?? [] }];
  }, [fieldGroups, fields]);

  const fieldByKey = useMemo(() => {
    const map = new Map<string, ToolField>();
    for (const group of effectiveFieldGroups) {
      for (const field of group.fields) {
        map.set(field.key, field);
      }
    }
    return map;
  }, [effectiveFieldGroups]);

  const tabs = useMemo(
    () =>
      DEFAULT_TABS.map((tab) => ({
        ...tab,
        label: tabLabels?.[tab.id] ?? tab.label,
      })),
    [tabLabels]
  );

  const resolvedLayoutVariant = useMemo<BuilderLayoutVariant>(() => {
    return layoutVariant ?? DEFAULT_LAYOUT_BY_NAV[navKey] ?? "atlas";
  }, [layoutVariant, navKey]);

  const relationSources = useMemo(() => {
    const unique = new Map<string, { endpoint: string; listKey: string }>();
    for (const group of effectiveFieldGroups) {
      for (const field of group.fields) {
        const relation = field.relation;
        if (!relation) continue;
        const sourceKey = `${relation.endpoint}::${relation.listKey}`;
        if (!unique.has(sourceKey)) {
          unique.set(sourceKey, { endpoint: relation.endpoint, listKey: relation.listKey });
        }
      }
    }

    return Array.from(unique.entries()).map(([sourceKey, source]) => ({
      sourceKey,
      ...source,
    }));
  }, [effectiveFieldGroups]);

  const canEditSelected = useMemo(() => {
    if (!selected) return false;
    return isLocalId(selected.id) || selected.canEdit === true;
  }, [selected]);

  useEffect(() => {
    let active = true;

    async function loadRelationData() {
      if (relationSources.length === 0) {
        setRelationData({});
        return;
      }

      const next: Record<string, ToolRecord[]> = {};
      await Promise.all(
        relationSources.map(async (source) => {
          if (source.endpoint === endpoint && source.listKey === listKey) return;

          try {
            const response = await fetch(source.endpoint, { cache: "no-store" });
            const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
            if (!response.ok || !payload?.ok) return;
            const rows = Array.isArray(payload[source.listKey])
              ? (payload[source.listKey] as ToolRecord[])
              : [];
            next[source.sourceKey] = rows;
          } catch (err) {
            console.error(`Load related source ${source.sourceKey} error:`, err);
          }
        })
      );

      if (!active) return;
      setRelationData(next);
    }

    void loadRelationData();
    return () => {
      active = false;
    };
  }, [relationSources, endpoint, listKey]);

  async function loadItems() {
    try {
      setLoading(true);
      const response = await fetch(endpoint, { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
      if (!response.ok || !data?.ok) {
        throw new Error(String(data?.error ?? "Failed to load items"));
      }

      const rawRows = data[listKey];
      const rows = Array.isArray(rawRows) ? (rawRows as ToolRecord[]) : [];
      setItems(rows);
      setSelectedId((current) => {
        if (current && rows.some((row) => String(row.id) === String(current))) return current;
        return rows[0]?.id ? String(rows[0].id) : null;
      });
    } catch (err) {
      console.error(`Load ${pluralLabel} error:`, err);
      setItems([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, listKey]);

  const filteredItems = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const searchable = `${item.name ?? ""} ${item.tagline ?? ""}`.toLowerCase();
      return searchable.includes(q);
    });
  }, [items, qtext]);

  function updateSelected(patch: Partial<ToolRecord>) {
    if (!selected) return;
    const idStr = String(selected.id);
    setItems((prev) =>
      prev.map((item) => (String(item.id) === idStr ? { ...item, ...patch } : item))
    );
  }

  function normalizeDataValue(value: unknown): unknown {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }
    if (Array.isArray(value)) {
      const isPrimitiveList = value.every((item) => {
        const type = typeof item;
        return type === "string" || type === "number";
      });

      if (isPrimitiveList) {
        const normalized = Array.from(new Set(normalizeStringArray(value)));
        return normalized.length > 0 ? normalized : null;
      }
      return value.length > 0 ? value : null;
    }

    return value ?? null;
  }

  function setSelectedDataFields(patch: Record<string, unknown>) {
    if (!selected) return;
    const currentData = selected.data ?? {};
    const nextData = { ...currentData } as Record<string, unknown>;

    for (const [fieldKey, value] of Object.entries(patch)) {
      nextData[fieldKey] = normalizeDataValue(value);
    }

    updateSelected({ data: nextData });
  }

  function setSelectedDataField(fieldKey: string, value: unknown) {
    setSelectedDataFields({ [fieldKey]: value });
  }

  function applyRelationPopulate(field: ToolField, relationOptionId: string): void {
    const relation = field.relation;
    if (!relation?.onSelectPopulate || !selected || !relationOptionId) return;

    const options = getRelationOptions(field);
    const selectedOption = options.find((option) => String(option.id) === relationOptionId);
    if (!selectedOption) return;

    try {
      const patch = relation.onSelectPopulate(selectedOption, selected);
      if (!patch || Object.keys(patch).length === 0) return;
      setSelectedDataFields(patch);
    } catch (err) {
      console.error(`Relation populate error for ${field.key}:`, err);
    }
  }

  function updateSingleRelationField(field: ToolField, relationOptionId: string): void {
    setSelectedDataField(field.key, relationOptionId || null);
    if (!relationOptionId) return;
    applyRelationPopulate(field, relationOptionId);
  }

  function createFromSelectedItem() {
    if (!selected || !createFromSelected) return;

    const id = uid();
    const seed = createFromSelected.build(selected, items) ?? {};
    const seededData =
      seed.data && typeof seed.data === "object"
        ? ({ ...(seed.data as Record<string, unknown>) } as Record<string, unknown>)
        : {};

    const fresh: ToolRecord = {
      id,
      name:
        typeof seed.name === "string" && seed.name.trim().length > 0
          ? seed.name
          : `New ${singularLabel}`,
      tagline: typeof seed.tagline === "string" ? seed.tagline : "",
      data: seededData,
      isFree: seed.isFree ?? selected.isFree ?? true,
      isPublished: seed.isPublished ?? false,
      canEdit: true,
    };

    setItems((prev) => [fresh, ...prev]);
    setSelectedId(String(id));
    setActiveTab("edit");
  }

  function updateSelectedField(field: ToolField, rawValue: string) {
    if (!selected) return;
    const kind = field.kind ?? "text";

    if (kind === "csv") {
      setSelectedDataField(field.key, parseCsv(rawValue));
    } else if (kind === "table") {
      setSelectedDataField(field.key, parseTable(rawValue, field.tableColumns ?? []));
    } else {
      setSelectedDataField(field.key, rawValue);
    }
  }

  function getFieldDisplayValue(item: ToolRecord, field: ToolField): string {
    const value = item.data?.[field.key];
    const kind = field.kind ?? "text";
    if (kind === "csv") return formatCsv(value);
    if (kind === "table") return formatTable(value, field.tableColumns ?? []);
    return typeof value === "string" ? value : "";
  }

  function getSelectOptions(field: ToolField): ToolSelectOption[] {
    if (!field.options || field.options.length === 0) return [];
    return field.options
      .map((option) => {
        if (typeof option === "string") {
          return { value: option, label: option };
        }
        return {
          value: option.value,
          label: option.label,
        };
      })
      .filter((option) => option.value.trim().length > 0);
  }

  function isFieldVisible(field: ToolField, item: ToolRecord | null): boolean {
    if (!item || !field.visibleWhen) return true;
    const { fieldKey, equals, oneOf } = field.visibleWhen;
    const raw = item.data?.[fieldKey];

    const normalizedValues = Array.isArray(raw)
      ? normalizeStringArray(raw).map((value) => value.toLowerCase())
      : [normalizeText(raw)];

    if (equals !== undefined) {
      return normalizedValues.includes(equals.trim().toLowerCase());
    }

    if (oneOf && oneOf.length > 0) {
      const set = new Set(oneOf.map((value) => value.trim().toLowerCase()));
      return normalizedValues.some((value) => set.has(value));
    }

    return true;
  }

  function getRelationOptions(field: ToolField): ToolRecord[] {
    const relation = field.relation;
    if (!relation) return [];
    const base =
      relation.endpoint === endpoint && relation.listKey === listKey
        ? items
        : relationData[`${relation.endpoint}::${relation.listKey}`] ?? [];

    if (!relation.filterOptions) return base;

    try {
      return base.filter((option) => relation.filterOptions?.(option, selected) ?? true);
    } catch (err) {
      console.error(`Relation filter error for ${field.key}:`, err);
      return base;
    }
  }

  function getRelationArrayValue(field: ToolField): string[] {
    if (!selected) return [];
    const raw = selected.data?.[field.key];
    if (Array.isArray(raw)) return normalizeStringArray(raw);
    if (typeof raw === "string" && raw.trim()) return [raw.trim()];
    return [];
  }

  function toggleRelationValue(field: ToolField, relationId: string, checked: boolean) {
    const currentValues = getRelationArrayValue(field);
    if (checked) {
      setSelectedDataField(field.key, [...currentValues, relationId]);
      return;
    }
    setSelectedDataField(
      field.key,
      currentValues.filter((id) => id !== relationId)
    );
  }

  function applyPreset(preset: ToolPreset) {
    if (!selected || !canEditSelected) return;
    const mergedData = {
      ...(selected.data ?? {}),
      ...(preset.data ?? {}),
    };
    updateSelected({
      name: preset.name ?? selected.name,
      tagline: preset.tagline ?? selected.tagline ?? "",
      data: mergedData,
      isFree: preset.isFree ?? selected.isFree ?? true,
      isPublished: preset.isPublished ?? selected.isPublished ?? false,
    });
    setActiveTab("edit");
  }

  function createItem() {
    const id = uid();
    const fresh: ToolRecord = {
      id,
      name: `New ${singularLabel}`,
      tagline: "",
      data: {},
      isFree: true,
      isPublished: false,
      canEdit: true,
    };
    setItems((prev) => [fresh, ...prev]);
    setSelectedId(String(id));
    setActiveTab("edit");
  }

  async function saveSelected() {
    if (!selected) return;
    if (!selected.name?.trim()) {
      alert(`${singularLabel} name is required.`);
      return;
    }
    if (!canEditSelected) {
      alert(`You can only edit ${pluralLabel.toLowerCase()} you created.`);
      return;
    }

    const isNew = isLocalId(selected.id);
    const payload = {
      name: selected.name.trim(),
      tagline: selected.tagline ?? null,
      data: selected.data ?? null,
      isFree: selected.isFree ?? true,
      isPublished: selected.isPublished ?? false,
    };

    try {
      setSaving(true);
      const response = await fetch(isNew ? endpoint : `${endpoint}/${selected.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
      if (!response.ok || !data?.ok) {
        throw new Error(String(data?.error ?? "Save failed"));
      }

      const returned = data[itemKey] as ToolRecord | undefined;
      if (returned) {
        const replaceId = String(selected.id);
        setItems((prev) =>
          prev.map((item) => (String(item.id) === replaceId ? returned : item))
        );
        setSelectedId(String(returned.id));
      } else {
        await loadItems();
      }
      alert(`${singularLabel} saved.`);
    } catch (err) {
      console.error(`Save ${singularLabel} error:`, err);
      alert(err instanceof Error ? err.message : `Failed to save ${singularLabel.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelected() {
    if (!selected) return;
    await deleteItem(selected);
  }

  async function deleteItem(item: ToolRecord) {
    const canEdit = isLocalId(item.id) || item.canEdit === true;
    if (!canEdit) {
      alert(`You can only delete ${pluralLabel.toLowerCase()} you created.`);
      return;
    }
    if (!confirm(`Delete ${item.name || singularLabel}?`)) return;

    const idStr = String(item.id);
    if (isLocalId(item.id)) {
      setItems((prev) => prev.filter((item) => String(item.id) !== idStr));
      if (String(selectedId ?? "") === idStr) {
        setSelectedId(null);
      }
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`${endpoint}/${item.id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
      if (!response.ok || !data?.ok) {
        throw new Error(String(data?.error ?? "Delete failed"));
      }
      setItems((prev) => prev.filter((item) => String(item.id) !== idStr));
      if (String(selectedId ?? "") === idStr) {
        setSelectedId(null);
      }
    } catch (err) {
      console.error(`Delete ${singularLabel} error:`, err);
      alert(err instanceof Error ? err.message : `Failed to delete ${singularLabel.toLowerCase()}.`);
    } finally {
      setDeleting(false);
    }
  }

  const layoutGridClass =
    resolvedLayoutVariant === "forge"
      ? "max-w-7xl mx-auto grid grid-cols-1 gap-4 sm:gap-6 mt-4 sm:mt-6"
      : resolvedLayoutVariant === "ledger"
      ? "max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-4 sm:gap-6 mt-4 sm:mt-6"
      : "max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-4 sm:gap-6 mt-4 sm:mt-6";

  const workspaceTagline =
    workspaceLabel ??
    (resolvedLayoutVariant === "ledger"
      ? "Command Board"
      : resolvedLayoutVariant === "forge"
      ? "Workshop"
      : "Atlas Desk");

  return (
    <main className="min-h-screen px-3 sm:px-4 py-6 sm:py-8">
      <header className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
        <WBNav current={navKey} />
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <GradientText
              as="h1"
              variant="title"
              glow
              className="font-evanescent text-2xl sm:text-3xl md:text-4xl tracking-tight"
            >
              {title}
            </GradientText>
            <p className="text-xs sm:text-sm text-zinc-300/90 max-w-2xl">{description}</p>
            {flavorLine && (
              <p className={["text-xs sm:text-sm max-w-3xl", theme?.badgeClass ?? "text-amber-200/90"].join(" ")}>
                {flavorLine}
              </p>
            )}
            <div
              className={[
                "inline-flex items-center gap-2 rounded-full border bg-black/30 px-3 py-1 text-[11px] uppercase tracking-wide text-zinc-200",
                theme?.panelClass ?? "border-violet-300/25",
              ].join(" ")}
            >
              <span className="text-zinc-400">Workspace</span>
              <span>{workspaceTagline}</span>
            </div>
          </div>
          <Link href="/worldbuilder/toolbox">
            <Button variant="secondary" size="sm">
              {"<-"} Toolbox
            </Button>
          </Link>
        </div>
      </header>

      {relatedTools && relatedTools.length > 0 && (
        <section className="max-w-7xl mx-auto mt-3 sm:mt-4">
          <Card
            padded={false}
            className={[
              "rounded-3xl border bg-white/5 backdrop-blur p-4 shadow-xl",
              theme?.panelClass ?? "border-violet-300/25",
            ].join(" ")}
          >
            <h2 className="text-sm font-semibold text-zinc-100">Related Builders</h2>
            <p className="mt-1 text-xs text-zinc-300/80">
              Jump into tools that commonly feed this one with IDs, lore, and reusable references.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {relatedTools.map((tool) => (
                <Link key={tool.href} href={tool.href} className="inline-flex">
                  <Button variant="secondary" size="sm" type="button">
                    {tool.label}
                  </Button>
                </Link>
              ))}
            </div>
            {relatedTools.some((tool) => tool.note) && (
              <div className="mt-3 space-y-1">
                {relatedTools.map((tool) => (
                  tool.note ? (
                    <p key={`${tool.href}-note`} className="text-[11px] text-zinc-400">
                      <span className="text-zinc-200">{tool.label}:</span> {tool.note}
                    </p>
                  ) : null
                ))}
              </div>
            )}
          </Card>
        </section>
      )}

      {(designCues && designCues.length > 0) && (
        <section className="max-w-7xl mx-auto mt-3 sm:mt-4">
          <Card
            padded={false}
            className={[
              "rounded-3xl border bg-white/5 backdrop-blur p-4 shadow-xl",
              theme?.panelClass ?? "border-violet-300/25",
            ].join(" ")}
          >
            <h2 className="text-sm font-semibold text-zinc-100">Design Cues</h2>
            <p className="mt-1 text-xs text-zinc-300/80">
              Keep this builder feeling distinct by leaning into these patterns.
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              {designCues.map((cue) => (
                <div
                  key={cue.title}
                  className="rounded-xl border border-white/10 bg-black/25 p-3"
                >
                  <p className="text-xs font-semibold text-zinc-100">{cue.title}</p>
                  <p className="mt-1 text-[11px] text-zinc-400">{cue.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      <section className={layoutGridClass}>
        <Card
          padded={false}
          className={[
            "rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl flex flex-col gap-4",
            resolvedLayoutVariant === "atlas" ? "order-1" : "order-2",
            theme?.sectionClass ?? "",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-200">{pluralLabel} Library</h2>
            <div className="flex items-center gap-2">
              {createFromSelected && selected && (
                <Button variant="secondary" size="sm" type="button" onClick={createFromSelectedItem}>
                  + {createFromSelected.label ?? `Child ${singularLabel}`}
                </Button>
              )}
              <Button variant="primary" size="sm" type="button" onClick={createItem}>
                + New {singularLabel}
              </Button>
            </div>
          </div>

          <Input
            value={qtext}
            onChange={(e) => setQtext(e.target.value)}
            placeholder={`Search ${pluralLabel.toLowerCase()}...`}
          />

          <div className="max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3 space-y-2">
            {loading ? (
              <p className="text-xs text-zinc-400">Loading...</p>
            ) : filteredItems.length === 0 ? (
              <p className="text-xs text-zinc-500">No entries found.</p>
            ) : (
              filteredItems.map((item) => {
                const isSelected = String(item.id) === String(selectedId ?? "");
                const canEdit = isLocalId(item.id) || item.canEdit === true;
                return (
                  <Card
                    key={String(item.id)}
                    className={[
                      "rounded-xl border p-3 cursor-pointer",
                      isSelected
                        ? (theme?.activeCardClass ?? "border-violet-400/40 bg-violet-400/10")
                        : "border-white/10 bg-white/5 hover:bg-white/10",
                    ].join(" ")}
                    onClick={() => {
                      setSelectedId(String(item.id));
                      setActiveTab("edit");
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-100 truncate">{item.name || "(untitled)"}</p>
                        <p className="text-xs text-zinc-400 line-clamp-2">{item.tagline || "No tagline"}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(String(item.id));
                          setActiveTab("edit");
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        disabled={!canEdit || deleting}
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteItem(item);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </Card>

        <Card
          padded={false}
          className={[
            "rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl",
            resolvedLayoutVariant === "atlas" ? "order-2" : "order-1",
            theme?.sectionClass ?? "",
          ].join(" ")}
        >
          {!selected ? (
            <p className="text-sm text-zinc-400">Select an entry or create a new one.</p>
          ) : (
            <>
              <div className="mb-4 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1">
                  <Input
                    value={selected.name}
                    onChange={(e) => updateSelected({ name: e.target.value })}
                    disabled={!canEditSelected}
                    placeholder={`${singularLabel} name`}
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">
                    ID: <span className="font-mono">{selected.id}</span>
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <Tabs tabs={tabs} activeId={activeTab} onChange={(id) => setActiveTab(id as BuilderTab)} />
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={deleteSelected}
                      disabled={!canEditSelected || deleting}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      type="button"
                      onClick={saveSelected}
                      disabled={!canEditSelected || saving}
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </div>

              {activeTab === "library" && (
                <div className="space-y-2">
                  <p className="text-sm text-zinc-300">
                    Use the library panel to browse, search, and select {pluralLabel.toLowerCase()}.
                  </p>
                </div>
              )}

              {activeTab === "edit" && (
                <div className="space-y-4">
                  {editHint && (
                    <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2">
                      <p className="text-xs text-zinc-300">{editHint}</p>
                    </div>
                  )}
                  {presets && presets.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-zinc-100">Archetype Seeds</h3>
                      <p className="text-xs text-zinc-400">
                        Click one to prefill this {singularLabel.toLowerCase()} with a distinct starting shape.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {presets.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => applyPreset(preset)}
                            disabled={!canEditSelected}
                            className="text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 disabled:opacity-50"
                          >
                            <p className="text-xs font-semibold text-zinc-100">{preset.label}</p>
                            {preset.summary && (
                              <p className="mt-1 text-[11px] text-zinc-400">{preset.summary}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <FormField label="Tagline" htmlFor="tool-tagline">
                    <Input
                      id="tool-tagline"
                      value={selected.tagline ?? ""}
                      disabled={!canEditSelected}
                      onChange={(e) => updateSelected({ tagline: e.target.value })}
                    />
                  </FormField>

                  {effectiveFieldGroups.map((group) => {
                    const visibleFields = group.fields.filter((field) => isFieldVisible(field, selected));
                    if (visibleFields.length === 0) return null;

                    return (
                      <div
                        key={group.title}
                        className={[
                          "rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3",
                          theme?.sectionClass ?? "",
                        ].join(" ")}
                      >
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-100">{group.title}</h3>
                          {group.description && (
                            <p className="text-xs text-zinc-400 mt-1">{group.description}</p>
                          )}
                        </div>
                        {visibleFields.map((field) => {
                        const kind = field.kind ?? "text";
                        const relation = field.relation;

                        if (relation) {
                          const relationLabel =
                            relation.label ??
                            field.label.replace(/\s*IDs?$/i, "").replace(/\s+$/, "");
                          const options = getRelationOptions(field)
                            .filter((option) => {
                              if (!relation.excludeCurrentItem || !selected) return true;
                              return String(option.id) !== String(selected.id);
                            })
                            .sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")));

                          if (relation.multi) {
                            const selectedValues = getRelationArrayValue(field);
                            const searchValue = relationSearch[field.key] ?? "";
                            const query = searchValue.trim().toLowerCase();
                            const filteredOptions = query
                              ? options.filter((option) => {
                                  const searchable =
                                    `${option.name ?? ""} ${option.tagline ?? ""} ${option.id ?? ""}`.toLowerCase();
                                  return searchable.includes(query);
                                })
                              : options;

                            return (
                              <FormField
                                key={field.key}
                                label={field.label}
                                htmlFor={`tool-${field.key}`}
                                description={field.description}
                              >
                                <div className="space-y-2">
                                  <Input
                                    id={`tool-${field.key}`}
                                    value={searchValue}
                                    disabled={!canEditSelected}
                                    placeholder={field.placeholder ?? `Filter ${relationLabel.toLowerCase()}...`}
                                    onChange={(e) =>
                                      setRelationSearch((current) => ({
                                        ...current,
                                        [field.key]: e.target.value,
                                      }))
                                    }
                                  />
                                  <div className="max-h-48 overflow-auto rounded-xl border border-white/10 bg-neutral-950/50 p-2 space-y-1">
                                    {filteredOptions.length === 0 ? (
                                      <p className="text-xs text-zinc-500">No matches found.</p>
                                    ) : (
                                      filteredOptions.map((option) => {
                                        const optionId = String(option.id);
                                        const checked = selectedValues.includes(optionId);
                                        return (
                                          <label
                                            key={optionId}
                                            className="flex items-start gap-2 rounded-lg px-2 py-1 text-xs text-zinc-100 hover:bg-white/10"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={checked}
                                              disabled={!canEditSelected}
                                              onChange={(e) => toggleRelationValue(field, optionId, e.target.checked)}
                                              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black/30"
                                            />
                                            <span className="min-w-0">
                                              <span className="block truncate">{option.name || "(untitled)"}</span>
                                              <span className="block truncate text-[11px] text-zinc-400 font-mono">
                                                {optionId}
                                              </span>
                                            </span>
                                          </label>
                                        );
                                      })
                                    )}
                                  </div>
                                  <p className="text-[11px] text-zinc-400">
                                    {selectedValues.length > 0
                                      ? `${selectedValues.length} linked ${relationLabel.toLowerCase()} selected.`
                                      : `No ${relationLabel.toLowerCase()} linked yet.`}
                                  </p>
                                </div>
                              </FormField>
                            );
                          }

                          const selectedValueRaw = selected.data?.[field.key];
                          const selectedValue =
                            typeof selectedValueRaw === "string" ? selectedValueRaw.trim() : "";
                          const hasCustomValue =
                            Boolean(selectedValue) &&
                            !options.some((option) => String(option.id) === selectedValue);

                          return (
                            <FormField
                              key={field.key}
                              label={field.label}
                              htmlFor={`tool-${field.key}`}
                              description={field.description}
                            >
                              <div className="space-y-2">
                                <select
                                  id={`tool-${field.key}`}
                                  value={selectedValue}
                                  disabled={!canEditSelected}
                                  onChange={(e) => updateSingleRelationField(field, e.target.value || "")}
                                  className="w-full rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                                >
                                  <option value="">Select {relationLabel}</option>
                                  {hasCustomValue && (
                                    <option value={selectedValue}>Current value ({selectedValue})</option>
                                  )}
                                  {options.map((option) => {
                                    const optionId = String(option.id);
                                    return (
                                      <option key={optionId} value={optionId}>
                                        {option.name || "(untitled)"} [{optionId}]
                                      </option>
                                    );
                                  })}
                                </select>
                                <p className="text-[11px] text-zinc-400">
                                  {selectedValue
                                    ? `Linked ID: ${selectedValue}`
                                    : `No ${relationLabel.toLowerCase()} selected.`}
                                </p>
                              </div>
                            </FormField>
                          );
                        }

                        if (kind === "select") {
                          const options = getSelectOptions(field);
                          const selectedValueRaw = selected.data?.[field.key];
                          const selectedValue =
                            typeof selectedValueRaw === "string" ? selectedValueRaw : "";

                          return (
                            <FormField
                              key={field.key}
                              label={field.label}
                              htmlFor={`tool-${field.key}`}
                              description={field.description}
                            >
                              <select
                                id={`tool-${field.key}`}
                                value={selectedValue}
                                disabled={!canEditSelected}
                                onChange={(e) => updateSelectedField(field, e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              >
                                <option value="">{field.placeholder ?? `Select ${field.label}`}</option>
                                {options.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </FormField>
                          );
                        }

                        const value = getFieldDisplayValue(selected, field);
                        const textRows = field.rows ?? (kind === "table" ? 5 : 4);
                        if (kind === "text" && textRows <= 1) {
                          return (
                            <FormField
                              key={field.key}
                              label={field.label}
                              htmlFor={`tool-${field.key}`}
                              description={field.description}
                            >
                              <Input
                                id={`tool-${field.key}`}
                                value={value}
                                disabled={!canEditSelected}
                                placeholder={field.placeholder}
                                onChange={(e) => updateSelectedField(field, e.target.value)}
                              />
                            </FormField>
                          );
                        }

                        return (
                          <FormField
                            key={field.key}
                            label={field.label}
                            htmlFor={`tool-${field.key}`}
                            description={field.description}
                          >
                            <textarea
                              id={`tool-${field.key}`}
                              value={value}
                              disabled={!canEditSelected}
                              placeholder={field.placeholder}
                              rows={textRows}
                              onChange={(e) => updateSelectedField(field, e.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                            />
                          </FormField>
                        );
                        })}
                      </div>
                    );
                  })}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm text-zinc-200">
                      <input
                        type="checkbox"
                        checked={selected.isFree ?? true}
                        disabled={!canEditSelected}
                        onChange={(e) => updateSelected({ isFree: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-black/30"
                      />
                      Free (visible to everyone)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-zinc-200">
                      <input
                        type="checkbox"
                        checked={selected.isPublished ?? false}
                        disabled={!canEditSelected}
                        onChange={(e) => updateSelected({ isPublished: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-black/30"
                      />
                      Published
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "preview" && (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-200 font-medium">{selected.name}</p>
                  <p className="text-xs text-zinc-400">{selected.tagline || "No tagline"}</p>
                  {renderPreview && (
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                      {renderPreview(selected)}
                    </div>
                  )}
                  {previewHighlights && previewHighlights.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {previewHighlights.map((highlight) => {
                        const field = fieldByKey.get(highlight.key);
                        const kind = highlight.kind ?? field?.kind ?? "text";
                        const formatted = formatPreviewValue(
                          selected.data?.[highlight.key],
                          kind,
                          field?.tableColumns ?? []
                        );
                        return (
                          <div
                            key={highlight.key}
                            className="rounded-xl border border-white/10 bg-black/30 p-3"
                          >
                            <p className="text-[11px] text-zinc-400">{highlight.label}</p>
                            <p className="mt-1 text-xs text-zinc-100 whitespace-pre-wrap">
                              {formatted || highlight.fallback || "Not set"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">Raw Data</p>
                  <pre className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-100 overflow-auto">
                    {JSON.stringify(selected.data ?? {}, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </Card>
      </section>
    </main>
  );
}
