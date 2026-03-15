"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { GradientText } from "@/components/GradientText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { Input } from "@/components/Input";
import { Tabs } from "@/components/Tabs";
import { WBNav } from "@/components/worldbuilder/WBNav";

type TabKey = "frame" | "layers" | "routes" | "script" | "preview";
type SortKey = "tree" | "name" | "updated";
type ScaleFilter = "__all__" | "__unscaled__" | string;

type ToolOption = {
  id: string;
  name: string;
  data: Record<string, unknown> | null;
};

type TableRow = Record<string, string>;

type GeoData = {
  scale?: string | null;
  scaleOther?: string | null;
  parentId?: string | null;
  description?: string | null;
  terrainProfile?: string | null;
  biome?: string | null;
  climate?: string | null;
  travelNotes?: string | null;
  hazards?: string | null;
  resources?: string | null;
  scarcityPressure?: string | null;
  marketLevers?: string | null;
  controllingFactionId?: string | null;
  sessionOpeners?: string | null;
  tags?: string[] | null;
  languageFamilies?: string[] | null;
  keyNpcIds?: string[] | null;
  settlementIds?: string[] | null;
  cultureIds?: string[] | null;
  dungeonIds?: string[] | null;
  economyIds?: string[] | null;
  primarySettlementId?: string | null;
  primaryCultureId?: string | null;
  primaryDungeonId?: string | null;
  primaryEconomyId?: string | null;
  resourceNodes?: TableRow[] | null;
  poiLedger?: TableRow[] | null;
  transitSpokes?: TableRow[] | null;
  culturalTensions?: TableRow[] | null;
  ruinHotspots?: TableRow[] | null;
  delveConsequences?: TableRow[] | null;
  tradeRoutes?: TableRow[] | null;
  travelScript?: TableRow[] | null;
  eventClock?: TableRow[] | null;
  [key: string]: unknown;
};

type GeoRow = {
  id: string | number;
  name: string;
  tagline: string | null;
  data: GeoData;
  isFree: boolean;
  isPublished: boolean;
  canEdit: boolean;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type Preset = {
  label: string;
  summary: string;
  name: string;
  tagline: string;
  data: Partial<GeoData>;
};

type TableFieldKey =
  | "resourceNodes"
  | "poiLedger"
  | "transitSpokes"
  | "culturalTensions"
  | "ruinHotspots"
  | "delveConsequences"
  | "tradeRoutes"
  | "travelScript"
  | "eventClock";

const TABS: { id: TabKey; label: string }[] = [
  { id: "frame", label: "Frame & Terrain" },
  { id: "layers", label: "World Layers" },
  { id: "routes", label: "Routes & Economy" },
  { id: "script", label: "Script Engine" },
  { id: "preview", label: "Live Preview" },
];

const SCALE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "world", label: "World" },
  { value: "continent", label: "Continent" },
  { value: "region", label: "Region" },
  { value: "province", label: "Province" },
  { value: "district", label: "District" },
  { value: "location", label: "Location" },
  { value: "poi", label: "Point of Interest" },
  { value: "other", label: "Other (Custom)" },
];

const TABLE_COLUMNS: Record<TableFieldKey, string[]> = {
  resourceNodes: ["resource", "location", "controller"],
  poiLedger: ["poi", "type", "spotlight"],
  transitSpokes: ["from", "to", "travel_time"],
  culturalTensions: ["group", "tension", "play_hook"],
  ruinHotspots: ["site", "state", "threat"],
  delveConsequences: ["trigger", "regional_shift"],
  tradeRoutes: ["route", "goods", "risk"],
  travelScript: ["trigger", "beat", "consequence"],
  eventClock: ["phase", "world_change", "gm_note"],
};

const NEXT_SCALE_BY_PARENT: Record<string, string> = {
  world: "continent",
  continent: "region",
  region: "province",
  province: "district",
  district: "location",
  location: "poi",
  poi: "other",
};

const uid = () => Math.random().toString(36).slice(2, 10);

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function toNullable(value: unknown): string | null {
  const v = asString(value).trim();
  return v ? v : null;
}

function normalizeStringArray(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const text = asString(item).trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

function normalizeTableRows(value: unknown, columns: string[]): TableRow[] {
  if (!Array.isArray(value)) return [];
  const rows: TableRow[] = [];
  for (const row of value) {
    const src = asRecord(row);
    const next: TableRow = {};
    let hasValue = false;
    for (const col of columns) {
      const text = asString(src[col]).trim();
      next[col] = text;
      if (text) hasValue = true;
    }
    if (hasValue) rows.push(next);
  }
  return rows;
}

function makeDefaultData(): GeoData {
  return {
    scale: "region",
    scaleOther: null,
    parentId: null,
    description: null,
    terrainProfile: null,
    biome: null,
    climate: null,
    travelNotes: null,
    hazards: null,
    resources: null,
    scarcityPressure: null,
    marketLevers: null,
    controllingFactionId: null,
    sessionOpeners: null,
    tags: [],
    languageFamilies: [],
    keyNpcIds: [],
    settlementIds: [],
    cultureIds: [],
    dungeonIds: [],
    economyIds: [],
    primarySettlementId: null,
    primaryCultureId: null,
    primaryDungeonId: null,
    primaryEconomyId: null,
    resourceNodes: [],
    poiLedger: [],
    transitSpokes: [],
    culturalTensions: [],
    ruinHotspots: [],
    delveConsequences: [],
    tradeRoutes: [],
    travelScript: [],
    eventClock: [],
  };
}

function normalizeData(value: unknown): GeoData {
  const src = asRecord(value);
  const next: GeoData = { ...src };

  next.scale = toNullable(src.scale) ?? "region";
  next.scaleOther = toNullable(src.scaleOther);
  next.parentId = toNullable(src.parentId);
  next.description = toNullable(src.description);
  next.terrainProfile = toNullable(src.terrainProfile);
  next.biome = toNullable(src.biome);
  next.climate = toNullable(src.climate);
  next.travelNotes = toNullable(src.travelNotes);
  next.hazards = toNullable(src.hazards);
  next.resources = toNullable(src.resources);
  next.scarcityPressure = toNullable(src.scarcityPressure);
  next.marketLevers = toNullable(src.marketLevers);
  next.controllingFactionId = toNullable(src.controllingFactionId);
  next.sessionOpeners = toNullable(src.sessionOpeners);

  next.tags = normalizeStringArray(src.tags);
  next.languageFamilies = normalizeStringArray(src.languageFamilies);
  next.keyNpcIds = normalizeStringArray(src.keyNpcIds);
  next.settlementIds = normalizeStringArray(src.settlementIds);
  next.cultureIds = normalizeStringArray(src.cultureIds);
  next.dungeonIds = normalizeStringArray(src.dungeonIds);
  next.economyIds = normalizeStringArray(src.economyIds);

  next.primarySettlementId = toNullable(src.primarySettlementId);
  next.primaryCultureId = toNullable(src.primaryCultureId);
  next.primaryDungeonId = toNullable(src.primaryDungeonId);
  next.primaryEconomyId = toNullable(src.primaryEconomyId);

  for (const field of Object.keys(TABLE_COLUMNS) as TableFieldKey[]) {
    next[field] = normalizeTableRows(src[field], TABLE_COLUMNS[field]);
  }

  return next;
}

function normalizeRow(value: unknown): GeoRow {
  const src = asRecord(value);
  return {
    id: asString(src.id) || uid(),
    name: asString(src.name) || "Untitled Geography",
    tagline: toNullable(src.tagline),
    data: normalizeData(src.data),
    isFree: src.isFree === undefined ? true : Boolean(src.isFree),
    isPublished: Boolean(src.isPublished),
    canEdit: src.canEdit === undefined ? true : Boolean(src.canEdit),
    createdBy: toNullable(src.createdBy),
    createdAt: toNullable(src.createdAt),
    updatedAt: toNullable(src.updatedAt),
  };
}

function getEffectiveScale(scale: unknown, scaleOther: unknown): string {
  const text = asString(scale).trim().toLowerCase();
  if (text === "other") return asString(scaleOther).trim().toLowerCase();
  return text;
}

function displayScale(data: GeoData): string {
  const scale = asString(data.scale).trim().toLowerCase();
  if (scale === "other") return asString(data.scaleOther).trim() || "Other";
  const found = SCALE_OPTIONS.find((option) => option.value === scale);
  return found?.label ?? (scale || "Unscaled");
}

function sortAsTree(rows: GeoRow[]): GeoRow[] {
  const byId = new Map<string, GeoRow>();
  const childrenByParent = new Map<string, GeoRow[]>();
  const roots: GeoRow[] = [];

  for (const row of rows) byId.set(String(row.id), row);
  for (const row of rows) {
    const id = String(row.id);
    const parentId = toNullable(row.data.parentId);
    if (parentId && parentId !== id && byId.has(parentId)) {
      const list = childrenByParent.get(parentId) ?? [];
      list.push(row);
      childrenByParent.set(parentId, list);
      continue;
    }
    roots.push(row);
  }

  const byName = (a: GeoRow, b: GeoRow) => a.name.localeCompare(b.name);
  roots.sort(byName);
  for (const [key, value] of childrenByParent.entries()) {
    value.sort(byName);
    childrenByParent.set(key, value);
  }

  const out: GeoRow[] = [];
  const visited = new Set<string>();
  const walk = (row: GeoRow) => {
    const id = String(row.id);
    if (visited.has(id)) return;
    visited.add(id);
    out.push(row);
    for (const child of childrenByParent.get(id) ?? []) walk(child);
  };
  for (const root of roots) walk(root);
  for (const row of rows) walk(row);
  return out;
}

function buildDepthMap(rows: GeoRow[]): Map<string, number> {
  const byId = new Map<string, GeoRow>();
  for (const row of rows) byId.set(String(row.id), row);
  const memo = new Map<string, number>();

  function depthFor(id: string, stack: Set<string>): number {
    if (memo.has(id)) return memo.get(id) ?? 0;
    if (stack.has(id)) return 0;
    stack.add(id);
    const row = byId.get(id);
    let depth = 0;
    const parentId = row ? toNullable(row.data.parentId) : null;
    if (parentId && parentId !== id && byId.has(parentId)) {
      depth = 1 + depthFor(parentId, stack);
    }
    memo.set(id, depth);
    stack.delete(id);
    return depth;
  }

  for (const row of rows) {
    depthFor(String(row.id), new Set<string>());
  }
  return memo;
}

function scoreRisk(data: GeoData): number {
  const hazard = asString(data.hazards).toLowerCase();
  const scarcity = asString(data.scarcityPressure).toLowerCase();
  const routeCount = normalizeTableRows(data.tradeRoutes, TABLE_COLUMNS.tradeRoutes).length;
  const clockCount = normalizeTableRows(data.eventClock, TABLE_COLUMNS.eventClock).length;
  const hotspotCount = normalizeTableRows(data.ruinHotspots, TABLE_COLUMNS.ruinHotspots).length;
  let score = routeCount * 5 + clockCount * 3 + hotspotCount * 4;
  for (const token of ["storm", "war", "siege", "ambush", "pirate", "curse", "flood"]) {
    if (hazard.includes(token)) score += 5;
  }
  for (const token of ["scarce", "short", "ration", "embargo", "tariff", "famine"]) {
    if (scarcity.includes(token)) score += 4;
  }
  return Math.max(0, Math.min(100, score));
}

function riskBand(score: number): string {
  if (score >= 70) return "Critical";
  if (score >= 45) return "Active";
  if (score >= 20) return "Shifting";
  return "Stable";
}

function previewLines(rows: TableRow[], columns: string[], max = 4): string[] {
  const out: string[] = [];
  for (const row of rows.slice(0, max)) {
    const line = columns.map((col) => asString(row[col]).trim()).filter(Boolean).join(" - ");
    if (line) out.push(line);
  }
  return out;
}

function parseJson(text: string): unknown {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function normalizeOptions(payload: unknown, listKey: string): ToolOption[] {
  const root = asRecord(payload);
  const list = root[listKey];
  if (!Array.isArray(list)) return [];
  const out: ToolOption[] = [];
  for (const item of list) {
    const src = asRecord(item);
    const id = asString(src.id).trim();
    if (!id) continue;
    out.push({
      id,
      name: asString(src.name) || "(unnamed)",
      data: asRecord(src.data),
    });
  }
  return out;
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function mergeUnique(current: string[], incoming: string[]): string[] {
  return normalizeStringArray([...current, ...incoming]);
}

type TokenEditorProps = {
  label: string;
  description?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  readOnly?: boolean;
};

function TokenEditor({
  label,
  description,
  value,
  onChange,
  placeholder,
  readOnly,
}: TokenEditorProps) {
  const [draft, setDraft] = useState("");

  function addToken() {
    if (readOnly) return;
    const next = mergeUnique(value, [draft]);
    onChange(next);
    setDraft("");
  }

  return (
    <FormField label={label} htmlFor={`${label}-token`} description={description}>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            id={`${label}-token`}
            value={draft}
            disabled={readOnly}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addToken();
              }
            }}
          />
          <Button type="button" variant="secondary" size="sm" onClick={addToken} disabled={readOnly || !draft.trim()}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {value.length === 0 ? (
            <span className="text-xs text-zinc-500">No entries.</span>
          ) : (
            value.map((entry) => (
              <span key={entry} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-2 py-1 text-xs text-zinc-200">
                {entry}
                {!readOnly ? (
                  <button
                    type="button"
                    className="text-zinc-400 hover:text-red-300"
                    onClick={() => onChange(value.filter((token) => token !== entry))}
                  >
                    x
                  </button>
                ) : null}
              </span>
            ))
          )}
        </div>
      </div>
    </FormField>
  );
}

type MultiLinkProps = {
  label: string;
  description?: string;
  options: ToolOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  readOnly?: boolean;
};

function MultiLinkEditor({
  label,
  description,
  options,
  value,
  onChange,
  placeholder,
  readOnly,
}: MultiLinkProps) {
  const [draft, setDraft] = useState("");
  const available = useMemo(
    () => options.filter((option) => !value.includes(option.id)),
    [options, value]
  );

  function add() {
    if (readOnly || !draft) return;
    onChange(mergeUnique(value, [draft]));
    setDraft("");
  }

  return (
    <FormField label={label} htmlFor={`${label}-relation`} description={description}>
      <div className="space-y-2">
        <div className="flex gap-2">
          <select
            id={`${label}-relation`}
            value={draft}
            disabled={readOnly}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-amber-400/40"
          >
            <option value="">{placeholder}</option>
            {available.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <Button type="button" variant="secondary" size="sm" onClick={add} disabled={readOnly || !draft}>
            Link
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {value.length === 0 ? (
            <span className="text-xs text-zinc-500">No linked records.</span>
          ) : (
            value.map((id) => (
              <span key={id} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-2 py-1 text-xs text-zinc-200">
                {options.find((option) => option.id === id)?.name ?? id}
                {!readOnly ? (
                  <button
                    type="button"
                    className="text-zinc-400 hover:text-red-300"
                    onClick={() => onChange(value.filter((item) => item !== id))}
                  >
                    x
                  </button>
                ) : null}
              </span>
            ))
          )}
        </div>
      </div>
    </FormField>
  );
}

type TableEditorProps = {
  title: string;
  description?: string;
  columns: string[];
  rows: TableRow[];
  onChange: (next: TableRow[]) => void;
  addLabel: string;
  readOnly?: boolean;
};

function TableEditor({
  title,
  description,
  columns,
  rows,
  onChange,
  addLabel,
  readOnly,
}: TableEditorProps) {
  function addRow() {
    if (readOnly) return;
    const row: TableRow = {};
    for (const col of columns) row[col] = "";
    onChange([...rows, row]);
  }

  function updateCell(rowIdx: number, col: string, value: string) {
    if (readOnly) return;
    onChange(
      rows.map((row, idx) => (idx === rowIdx ? { ...row, [col]: value } : row))
    );
  }

  function removeRow(rowIdx: number) {
    if (readOnly) return;
    onChange(rows.filter((_, idx) => idx !== rowIdx));
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-100">{title}</p>
          {description ? <p className="text-xs text-zinc-400 mt-1">{description}</p> : null}
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={addRow} disabled={readOnly}>
          {addLabel}
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500">No rows yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, rowIdx) => (
            <div key={`${title}-${rowIdx}`} className="rounded-xl border border-white/10 bg-white/5 p-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {columns.map((col) => (
                  <div key={`${title}-${rowIdx}-${col}`} className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wide text-zinc-400">
                      {col.replaceAll("_", " ")}
                    </label>
                    <Input
                      value={row[col] ?? ""}
                      disabled={readOnly}
                      onChange={(e) => updateCell(rowIdx, col, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              {!readOnly ? (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    className="text-xs text-red-300 hover:text-red-200"
                    onClick={() => removeRow(rowIdx)}
                  >
                    Remove Row
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PRESETS: Preset[] = [
  {
    label: "Border War Corridor",
    summary: "Contested frontier where logistics and ruin pressure collide.",
    name: "Ashline March",
    tagline: "No route stays safe for long.",
    data: {
      scale: "region",
      biome: "storm-scarred highland steppe",
      climate: "cold dry season, violent ash squalls",
      hazards: "Minefield remnants, sink trenches, raider funnels.",
      resources: "Iron bloom, hardy grain, tactical spring-water wells.",
      scarcityPressure: "Mount feed and healing supplies run short in campaign months.",
      tags: ["frontier", "warzone", "trade-route"],
      tradeRoutes: [
        { route: "Cinder Quay -> Ashline", goods: "salt, weapon oil", risk: "splinter captain tolls" },
      ],
      travelScript: [
        { trigger: "Party enters border road", beat: "refugee caravan blocks passage", consequence: "escort, bribe, or delay" },
      ],
      eventClock: [
        { phase: "Phase 1", world_change: "checkpoint authority fractures", gm_note: "players pick who stabilizes roads" },
      ],
    },
  },
  {
    label: "Pilgrim Basin",
    summary: "Faith routes and trade routes overlap every week.",
    name: "Silver Hymn Basin",
    tagline: "Faith moves people, and people move markets.",
    data: {
      scale: "province",
      biome: "river basin with terrace temples",
      climate: "flood season + dry pilgrimage windows",
      hazards: "Flash floods, relic theft rings, zealot checkpoints.",
      resources: "Rice terraces, incense resin, vellum, ritual dyes.",
      tags: ["pilgrimage", "river", "culture-linked"],
      culturalTensions: [
        { group: "Urban clergy vs river clans", tension: "festival route ownership", play_hook: "arbitrate shrine access" },
      ],
    },
  },
  {
    label: "Shattered Delta",
    summary: "Trade web with ruins and volatile channels.",
    name: "Glasswater Delta",
    tagline: "Every channel is a border and a deal.",
    data: {
      scale: "district",
      biome: "tidal marsh delta and broken city isles",
      climate: "humid storms with sudden high-water turns",
      hazards: "Silt collapses, snare lines, spectral fog.",
      resources: "Salt fish, pearl glass, salvage bronze.",
      tags: ["delta", "trade-linked", "ruin-linked"],
      ruinHotspots: [
        { site: "Sunken Ledger Hall", state: "partially submerged", threat: "wardens reactivate at low tide" },
      ],
      tradeRoutes: [
        { route: "Outer reef -> market spine", goods: "salt fish, shell lacquer", risk: "pirate toll skiffs" },
      ],
    },
  },
];

export default function GeographyPage() {
  const [rows, setRows] = useState<GeoRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("frame");
  const [qtext, setQtext] = useState("");
  const [scaleFilter, setScaleFilter] = useState<ScaleFilter>("__all__");
  const [sortKey, setSortKey] = useState<SortKey>("tree");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scriptCursor, setScriptCursor] = useState(0);

  const [settlements, setSettlements] = useState<ToolOption[]>([]);
  const [cultures, setCultures] = useState<ToolOption[]>([]);
  const [dungeons, setDungeons] = useState<ToolOption[]>([]);
  const [economy, setEconomy] = useState<ToolOption[]>([]);
  const [factions, setFactions] = useState<ToolOption[]>([]);
  const [npcs, setNpcs] = useState<ToolOption[]>([]);

  const selected = useMemo(
    () => rows.find((row) => String(row.id) === String(selectedId ?? "")) ?? null,
    [rows, selectedId]
  );
  const selectedData = selected?.data ?? makeDefaultData();
  const readOnly = Boolean(selected && selected.canEdit === false);

  const depthMap = useMemo(() => buildDepthMap(rows), [rows]);

  const orderedRows = useMemo(() => {
    if (sortKey === "tree") return sortAsTree(rows);
    const sorted = [...rows].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();
    });
    return sorted;
  }, [rows, sortKey]);

  const filteredRows = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    return orderedRows.filter((row) => {
      const scale = getEffectiveScale(row.data.scale, row.data.scaleOther);
      if (scaleFilter === "__unscaled__" && scale) return false;
      if (scaleFilter !== "__all__" && scaleFilter !== "__unscaled__" && scale !== scaleFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        row.name,
        row.tagline ?? "",
        row.data.description ?? "",
        row.data.biome ?? "",
        row.data.climate ?? "",
        normalizeStringArray(row.data.tags).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orderedRows, qtext, scaleFilter]);

  const scaleOptions = useMemo(() => {
    const all = new Set<string>();
    for (const row of rows) {
      const scale = getEffectiveScale(row.data.scale, row.data.scaleOther);
      if (scale) all.add(scale);
    }
    return Array.from(all).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const factionNameById = useMemo(
    () => new Map(factions.map((item) => [item.id, item.name])),
    [factions]
  );
  const npcNameById = useMemo(
    () => new Map(npcs.map((item) => [item.id, item.name])),
    [npcs]
  );

  const scriptBeats = useMemo(() => {
    const travel = normalizeTableRows(selectedData.travelScript, TABLE_COLUMNS.travelScript);
    const clock = normalizeTableRows(selectedData.eventClock, TABLE_COLUMNS.eventClock);
    const out: Array<{ label: string; trigger: string; beat: string; consequence: string }> = [];
    for (const row of travel) {
      out.push({
        label: "Travel Beat",
        trigger: toNullable(row.trigger) ?? "Trigger not set",
        beat: toNullable(row.beat) ?? "Beat not set",
        consequence: toNullable(row.consequence) ?? "Consequence not set",
      });
    }
    for (const row of clock) {
      out.push({
        label: toNullable(row.phase) ? `Clock ${row.phase}` : "Clock Phase",
        trigger: toNullable(row.phase) ?? "Phase not set",
        beat: toNullable(row.world_change) ?? "World shift not set",
        consequence: toNullable(row.gm_note) ?? "GM note not set",
      });
    }
    return out;
  }, [selectedData.travelScript, selectedData.eventClock]);

  const currentBeat =
    scriptBeats.length > 0 ? scriptBeats[scriptCursor % scriptBeats.length] : null;

  const metrics = useMemo(() => {
    const linkedBuckets = [
      normalizeStringArray(selectedData.settlementIds).length > 0,
      normalizeStringArray(selectedData.cultureIds).length > 0,
      normalizeStringArray(selectedData.dungeonIds).length > 0,
      normalizeStringArray(selectedData.economyIds).length > 0,
      normalizeStringArray(selectedData.keyNpcIds).length > 0,
      Boolean(toNullable(selectedData.controllingFactionId)),
    ];
    const connected = linkedBuckets.filter(Boolean).length;
    const coverage = Math.round((connected / linkedBuckets.length) * 100);
    const nodes =
      normalizeTableRows(selectedData.poiLedger, TABLE_COLUMNS.poiLedger).length +
      normalizeTableRows(selectedData.resourceNodes, TABLE_COLUMNS.resourceNodes).length +
      normalizeTableRows(selectedData.ruinHotspots, TABLE_COLUMNS.ruinHotspots).length;
    const beats =
      normalizeTableRows(selectedData.travelScript, TABLE_COLUMNS.travelScript).length +
      normalizeTableRows(selectedData.eventClock, TABLE_COLUMNS.eventClock).length;
    const risk = scoreRisk(selectedData);
    return { coverage, connected, nodes, beats, risk, riskBand: riskBand(risk) };
  }, [selectedData]);

  useEffect(() => {
    setScriptCursor(0);
  }, [selectedId]);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const requests = await Promise.all([
          fetch("/api/worldbuilder/geography", { cache: "no-store" }),
          fetch("/api/worldbuilder/settlements", { cache: "no-store" }),
          fetch("/api/worldbuilder/cultures", { cache: "no-store" }),
          fetch("/api/worldbuilder/dungeons", { cache: "no-store" }),
          fetch("/api/worldbuilder/economy", { cache: "no-store" }),
          fetch("/api/worldbuilder/factions", { cache: "no-store" }),
          fetch("/api/worldbuilder/npcs", { cache: "no-store" }),
        ]);

        const payloads = await Promise.all(requests.map(async (res) => parseJson(await res.text())));
        const geoPayload = asRecord(payloads[0]);
        const geoList = Array.isArray(geoPayload.geography) ? geoPayload.geography : [];
        const nextRows = geoList.map((row) => normalizeRow(row));
        setRows(nextRows);
        setSelectedId((prev) => {
          if (prev && nextRows.some((row) => String(row.id) === prev)) return prev;
          return nextRows.length > 0 ? String(nextRows[0]?.id ?? "") : null;
        });

        setSettlements(normalizeOptions(payloads[1], "settlements"));
        setCultures(normalizeOptions(payloads[2], "cultures"));
        setDungeons(normalizeOptions(payloads[3], "dungeons"));
        setEconomy(normalizeOptions(payloads[4], "economy"));
        setFactions(normalizeOptions(payloads[5], "factions"));
        setNpcs(normalizeOptions(payloads[6], "npcs"));
      } catch (err) {
        console.error("Failed loading geography page:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadAll();
  }, []);

  useEffect(() => {
    if (filteredRows.length === 0) return;
    const stillVisible = filteredRows.some((row) => String(row.id) === String(selectedId ?? ""));
    if (!stillVisible) setSelectedId(String(filteredRows[0]?.id ?? ""));
  }, [filteredRows, selectedId]);

  function updateSelected(mutator: (row: GeoRow) => GeoRow) {
    if (!selected) return;
    const id = String(selected.id);
    setRows((prev) =>
      prev.map((row) => {
        if (String(row.id) !== id) return row;
        if (row.canEdit === false) return row;
        return { ...mutator(row), updatedAt: new Date().toISOString() };
      })
    );
  }

  function patchData(patch: Partial<GeoData>) {
    updateSelected((row) => ({ ...row, data: normalizeData({ ...row.data, ...patch }) }));
  }

  function setTable(field: TableFieldKey, next: TableRow[]) {
    patchData({ [field]: next } as Partial<GeoData>);
  }

  function createRegion() {
    const row: GeoRow = {
      id: uid(),
      name: "New Geography Region",
      tagline: "",
      data: makeDefaultData(),
      isFree: true,
      isPublished: false,
      canEdit: true,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRows((prev) => [row, ...prev]);
    setSelectedId(String(row.id));
    setActiveTab("frame");
  }

  function createChild() {
    if (!selected) return;
    const parentScale = getEffectiveScale(selectedData.scale, selectedData.scaleOther);
    const childScale = NEXT_SCALE_BY_PARENT[parentScale] ?? "other";
    const row: GeoRow = {
      id: uid(),
      name: `${selected.name} - New Area`,
      tagline: "",
      data: normalizeData({
        ...makeDefaultData(),
        parentId: String(selected.id),
        scale: childScale,
        scaleOther: childScale === "other" ? "sub-area" : null,
        biome: selectedData.biome,
        climate: selectedData.climate,
        description: `Subregion of ${selected.name}.`,
        tags: normalizeStringArray(selectedData.tags),
      }),
      isFree: selected.isFree,
      isPublished: false,
      canEdit: true,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRows((prev) => [row, ...prev]);
    setSelectedId(String(row.id));
  }

  function applyPreset(preset: Preset) {
    const row: GeoRow = {
      id: uid(),
      name: preset.name,
      tagline: preset.tagline,
      data: normalizeData({ ...makeDefaultData(), ...preset.data }),
      isFree: true,
      isPublished: false,
      canEdit: true,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRows((prev) => [row, ...prev]);
    setSelectedId(String(row.id));
    setActiveTab("frame");
  }

  function firstTableLine(value: unknown, columns: string[]): string | null {
    const rows = normalizeTableRows(value, columns);
    if (rows.length === 0) return null;
    const row = rows[0] ?? {};
    const line = columns.map((col) => asString(row[col]).trim()).filter(Boolean).join(" - ");
    return line || null;
  }

  function absorbParent() {
    if (!selected) return;
    const parentId = toNullable(selectedData.parentId);
    if (!parentId) return;
    const parent = rows.find((row) => String(row.id) === parentId);
    if (!parent) return;
    patchData({
      biome: selectedData.biome || parent.data.biome || null,
      climate: selectedData.climate || parent.data.climate || null,
      controllingFactionId:
        selectedData.controllingFactionId || parent.data.controllingFactionId || null,
      tags: mergeUnique(normalizeStringArray(selectedData.tags), normalizeStringArray(parent.data.tags)),
      description: selectedData.description || `Subregion of ${parent.name}.`,
    });
  }

  function absorbSettlement() {
    if (!selected) return;
    const id = toNullable(selectedData.primarySettlementId);
    if (!id) return;
    const source = settlements.find((entry) => entry.id === id);
    if (!source) return;
    patchData({
      controllingFactionId:
        selectedData.controllingFactionId || toNullable(source.data?.controllingFactionId),
      travelNotes: selectedData.travelNotes || toNullable(source.data?.economy),
      resources: selectedData.resources || toNullable(source.data?.economy),
      hazards: selectedData.hazards || toNullable(source.data?.problems),
      tags: mergeUnique(normalizeStringArray(selectedData.tags), ["settlement-linked"]),
    });
  }

  function absorbCulture() {
    if (!selected) return;
    const id = toNullable(selectedData.primaryCultureId);
    if (!id) return;
    const source = cultures.find((entry) => entry.id === id);
    if (!source) return;
    const phrase = toNullable(source.data?.commonPhrases);
    patchData({
      sessionOpeners: selectedData.sessionOpeners || (phrase ? `Locals greet outsiders with: ${phrase}` : null),
      tags: mergeUnique(normalizeStringArray(selectedData.tags), ["culture-linked"]),
    });
  }

  function absorbDungeon() {
    if (!selected) return;
    const id = toNullable(selectedData.primaryDungeonId);
    if (!id) return;
    const source = dungeons.find((entry) => entry.id === id);
    if (!source) return;
    const hazardLine = firstTableLine(source.data?.hazardTable, ["roll", "hazard"]);
    patchData({
      hazards: selectedData.hazards || hazardLine,
      sessionOpeners: selectedData.sessionOpeners || toNullable(source.data?.entranceHook),
      tags: mergeUnique(normalizeStringArray(selectedData.tags), ["ruin-linked"]),
    });
  }

  function absorbEconomy() {
    if (!selected) return;
    const id = toNullable(selectedData.primaryEconomyId);
    if (!id) return;
    const source = economy.find((entry) => entry.id === id);
    if (!source) return;
    patchData({
      resources: selectedData.resources || toNullable(source.data?.tradeGoods),
      scarcityPressure: selectedData.scarcityPressure || toNullable(source.data?.scarcity),
      travelNotes: selectedData.travelNotes || toNullable(source.data?.priceNotes),
      tags: mergeUnique(normalizeStringArray(selectedData.tags), ["trade-linked"]),
    });
  }

  async function saveSelected() {
    if (!selected) return;
    if (readOnly) {
      alert("You cannot edit this region.");
      return;
    }

    const payload = {
      name: selected.name.trim() || "Untitled Geography",
      tagline: toNullable(selected.tagline),
      data: normalizeData(selected.data),
      isFree: selected.isFree,
      isPublished: selected.isPublished,
    };

    const isNew = typeof selected.id === "string" && !isUuidLike(String(selected.id));
    setSaving(true);
    try {
      const response = await fetch(
        isNew ? "/api/worldbuilder/geography" : `/api/worldbuilder/geography/${selected.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const body = parseJson(await response.text());
      const root = asRecord(body);
      if (!response.ok || root.ok !== true) {
        throw new Error(asString(root.error) || "Failed to save geography entry");
      }
      const saved = normalizeRow(root.geography);
      const prevId = String(selected.id);
      setRows((prev) => prev.map((row) => (String(row.id) === prevId ? saved : row)));
      setSelectedId(String(saved.id));
      alert("Geography entry saved.");
    } catch (err) {
      console.error("Save geography error:", err);
      alert(`Failed to save geography: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelected() {
    if (!selected) return;
    if (readOnly) {
      alert("You cannot delete this region.");
      return;
    }
    if (!confirm(`Delete "${selected.name}"?`)) return;

    const id = String(selected.id);
    const isUnsaved = typeof selected.id === "string" && !isUuidLike(id);
    if (isUnsaved) {
      setRows((prev) => prev.filter((row) => String(row.id) !== id));
      setSelectedId(null);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/worldbuilder/geography/${selected.id}`, {
        method: "DELETE",
      });
      const body = parseJson(await response.text());
      const root = asRecord(body);
      if (!response.ok || root.ok !== true) {
        throw new Error(asString(root.error) || "Failed to delete geography entry");
      }
      setRows((prev) => prev.filter((row) => String(row.id) !== id));
      setSelectedId(null);
    } catch (err) {
      console.error("Delete geography error:", err);
      alert(`Failed to delete geography: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  function namesFrom(ids: string[], options: ToolOption[]): string {
    return ids.map((id) => options.find((item) => item.id === id)?.name ?? id).join(", ");
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <header className="max-w-7xl mx-auto mb-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <GradientText
              as="h1"
              variant="title"
              glow
              className="font-evanescent text-4xl sm:text-5xl tracking-tight"
            >
              The Source Forge - Geography Engine
            </GradientText>
            <p className="mt-1 text-sm text-zinc-300/90 max-w-3xl">
              Build geography as a living system. Link settlements, cultures, dungeons,
              economy, and scripted events so the region can run sessions.
            </p>
          </div>
          <Link href="/worldbuilder/toolbox">
            <Button variant="secondary" size="sm">
              {"<-"} Toolbox
            </Button>
          </Link>
        </div>
        <div className="flex justify-end">
          <WBNav current="geography" />
        </div>
      </header>

      <section className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[320px,1fr] gap-6">
        <Card
          padded={false}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-200">Geography Library</h2>
            <Button size="sm" onClick={createRegion}>+ New</Button>
          </div>

          <Input
            value={qtext}
            onChange={(e) => setQtext(e.target.value)}
            placeholder="Search name, biome, tags, or notes..."
          />
          <select
            value={scaleFilter}
            onChange={(e) => setScaleFilter(e.target.value as ScaleFilter)}
            className="w-full rounded-md border border-white/15 bg-black/50 px-2 py-2 text-xs text-zinc-100 outline-none focus:ring-2 focus:ring-amber-400/40"
          >
            <option value="__all__">Scale: All</option>
            <option value="__unscaled__">Scale: Unscaled</option>
            {scaleOptions.map((scale) => (
              <option key={scale} value={scale}>{`Scale: ${scale}`}</option>
            ))}
          </select>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="w-full rounded-md border border-white/15 bg-black/50 px-2 py-2 text-xs text-zinc-100 outline-none focus:ring-2 focus:ring-amber-400/40"
          >
            <option value="tree">Sort: Hierarchy</option>
            <option value="name">Sort: Name</option>
            <option value="updated">Sort: Updated</option>
          </select>
          <Button variant="secondary" size="sm" disabled={!selected} onClick={createChild}>
            + Child Region
          </Button>

          <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/5 p-3 space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-cyan-100">Quick Templates</p>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className="w-full rounded-lg border border-white/10 bg-black/30 p-2 text-left hover:bg-white/10"
              >
                <p className="text-xs font-semibold text-zinc-100">{preset.label}</p>
                <p className="text-[11px] text-zinc-400">{preset.summary}</p>
              </button>
            ))}
          </div>

          <div className="mt-1 flex-1 min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 border-b border-white/10">
              <span>{`Regions: ${filteredRows.length} shown / ${rows.length} total`}</span>
              <span className="uppercase tracking-wide text-[10px] text-zinc-500">Library</span>
            </div>
            <div className="max-h-[520px] overflow-auto">
              {loading ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">Loading geography...</div>
              ) : filteredRows.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">No regions in this filter.</div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-left text-zinc-400">
                    <tr>
                      <th className="px-3 py-1">Name</th>
                      <th className="px-3 py-1">Scale</th>
                      <th className="px-3 py-1">Pulse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => {
                      const id = String(row.id);
                      const isSel = id === selectedId;
                      const depth = depthMap.get(id) ?? 0;
                      const pulse = riskBand(scoreRisk(row.data));
                      return (
                        <tr
                          key={id}
                          className={`border-t border-white/5 cursor-pointer hover:bg-white/5 ${isSel ? "bg-white/10" : ""}`}
                          onClick={() => setSelectedId(id)}
                        >
                          <td className="px-3 py-1.5">
                            <div className="flex items-center gap-2" style={{ paddingLeft: `${Math.min(depth, 8) * 12}px` }}>
                              {depth > 0 ? <span className="text-zinc-500 text-[10px]">|-</span> : null}
                              <span>{row.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-1.5 text-zinc-300">{displayScale(row.data)}</td>
                          <td className="px-3 py-1.5 text-zinc-300">{pulse}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </Card>

        <Card padded={false} className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl">
          {!selected ? (
            <div className="h-full min-h-[360px] flex items-center justify-center text-zinc-400 text-sm">
              Select a region on the left or create one to begin.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label="Region Name" htmlFor="geo-name">
                  <Input
                    id="geo-name"
                    value={selected.name}
                    disabled={readOnly}
                    onChange={(e) => updateSelected((row) => ({ ...row, name: e.target.value }))}
                  />
                </FormField>
                <FormField label="Tagline" htmlFor="geo-tagline">
                  <Input
                    id="geo-tagline"
                    value={selected.tagline ?? ""}
                    disabled={readOnly}
                    onChange={(e) => updateSelected((row) => ({ ...row, tagline: e.target.value }))}
                    placeholder="One-line identity..."
                  />
                </FormField>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={selected.isFree}
                    disabled={readOnly}
                    onChange={(e) => updateSelected((row) => ({ ...row, isFree: e.target.checked }))}
                  />
                  Free/Public
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={selected.isPublished}
                    disabled={readOnly}
                    onChange={(e) => updateSelected((row) => ({ ...row, isPublished: e.target.checked }))}
                  />
                  Published
                </label>
                {readOnly ? <span className="text-xs text-amber-300">Read-only entry</span> : null}
                <div className="ml-auto flex gap-2">
                  <Button size="sm" onClick={saveSelected} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button size="sm" variant="danger" onClick={deleteSelected} disabled={saving}>
                    Delete
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <div><p className="text-zinc-400">Coverage</p><p className="text-zinc-100">{metrics.coverage}%</p></div>
                  <div><p className="text-zinc-400">Connected</p><p className="text-zinc-100">{metrics.connected}/6</p></div>
                  <div><p className="text-zinc-400">Map Nodes</p><p className="text-zinc-100">{metrics.nodes}</p></div>
                  <div><p className="text-zinc-400">Script Beats</p><p className="text-zinc-100">{metrics.beats}</p></div>
                  <div><p className="text-zinc-400">Risk Pulse</p><p className="text-zinc-100">{metrics.riskBand}</p></div>
                </div>
              </div>

              <Tabs tabs={TABS} activeId={activeTab} onChange={(id) => setActiveTab(id as TabKey)} />

              <div className="space-y-4">
                {activeTab === "frame" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Scale" htmlFor="geo-scale">
                        <select
                          id="geo-scale"
                          value={selectedData.scale ?? "region"}
                          disabled={readOnly}
                          onChange={(e) => patchData({ scale: e.target.value })}
                          className="w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-amber-400/40"
                        >
                          {SCALE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </FormField>
                      <FormField label="Parent Geography" htmlFor="geo-parent">
                        <div className="flex gap-2">
                          <select
                            id="geo-parent"
                            value={selectedData.parentId ?? ""}
                            disabled={readOnly}
                            onChange={(e) => patchData({ parentId: e.target.value || null })}
                            className="w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-amber-400/40"
                          >
                            <option value="">No parent</option>
                            {rows
                              .filter((row) => String(row.id) !== String(selected.id))
                              .map((row) => (
                                <option key={String(row.id)} value={String(row.id)}>
                                  {row.name}
                                </option>
                              ))}
                          </select>
                          <Button size="sm" variant="secondary" onClick={absorbParent} disabled={readOnly || !selectedData.parentId}>
                            Absorb
                          </Button>
                        </div>
                      </FormField>
                    </div>

                    {(selectedData.scale ?? "") === "other" ? (
                      <FormField label="Custom Scale Label" htmlFor="geo-scale-other">
                        <Input
                          id="geo-scale-other"
                          value={selectedData.scaleOther ?? ""}
                          disabled={readOnly}
                          onChange={(e) => patchData({ scaleOther: e.target.value })}
                          placeholder="archipelago, crater-belt..."
                        />
                      </FormField>
                    ) : null}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Biome" htmlFor="geo-biome">
                        <Input
                          id="geo-biome"
                          value={selectedData.biome ?? ""}
                          disabled={readOnly}
                          onChange={(e) => patchData({ biome: e.target.value })}
                        />
                      </FormField>
                      <FormField label="Climate" htmlFor="geo-climate">
                        <Input
                          id="geo-climate"
                          value={selectedData.climate ?? ""}
                          disabled={readOnly}
                          onChange={(e) => patchData({ climate: e.target.value })}
                        />
                      </FormField>
                    </div>

                    <FormField label="Description" htmlFor="geo-description">
                      <textarea
                        id="geo-description"
                        className="w-full min-h-[96px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selectedData.description ?? ""}
                        disabled={readOnly}
                        onChange={(e) => patchData({ description: e.target.value })}
                      />
                    </FormField>
                    <FormField label="Terrain Profile" htmlFor="geo-terrain">
                      <textarea
                        id="geo-terrain"
                        className="w-full min-h-[84px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selectedData.terrainProfile ?? ""}
                        disabled={readOnly}
                        onChange={(e) => patchData({ terrainProfile: e.target.value })}
                      />
                    </FormField>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Travel Notes" htmlFor="geo-travel">
                        <textarea
                          id="geo-travel"
                          className="w-full min-h-[96px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                          value={selectedData.travelNotes ?? ""}
                          disabled={readOnly}
                          onChange={(e) => patchData({ travelNotes: e.target.value })}
                        />
                      </FormField>
                      <FormField label="Hazards" htmlFor="geo-hazards">
                        <textarea
                          id="geo-hazards"
                          className="w-full min-h-[96px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                          value={selectedData.hazards ?? ""}
                          disabled={readOnly}
                          onChange={(e) => patchData({ hazards: e.target.value })}
                        />
                      </FormField>
                    </div>
                    <TokenEditor
                      label="Tags"
                      value={normalizeStringArray(selectedData.tags)}
                      onChange={(next) => patchData({ tags: next })}
                      placeholder="coastal"
                      readOnly={readOnly}
                    />
                    <TokenEditor
                      label="Language Families"
                      value={normalizeStringArray(selectedData.languageFamilies)}
                      onChange={(next) => patchData({ languageFamilies: next })}
                      placeholder="Old Vale"
                      readOnly={readOnly}
                    />
                    <TableEditor
                      title="Resource Nodes"
                      description="Key extraction/gathering points and owners."
                      columns={TABLE_COLUMNS.resourceNodes}
                      rows={normalizeTableRows(selectedData.resourceNodes, TABLE_COLUMNS.resourceNodes)}
                      onChange={(next) => setTable("resourceNodes", next)}
                      addLabel="+ Node"
                      readOnly={readOnly}
                    />
                  </div>
                ) : null}

                {activeTab === "layers" ? (
                  <div className="space-y-4">
                    <MultiLinkEditor
                      label="Linked Settlements & POIs"
                      options={settlements}
                      value={normalizeStringArray(selectedData.settlementIds)}
                      onChange={(next) => patchData({ settlementIds: next })}
                      placeholder="Choose settlement..."
                      readOnly={readOnly}
                    />
                    <FormField label="Primary Settlement Anchor" htmlFor="geo-pri-settlement">
                      <div className="flex gap-2">
                        <select
                          id="geo-pri-settlement"
                          value={selectedData.primarySettlementId ?? ""}
                          disabled={readOnly}
                          onChange={(e) => patchData({ primarySettlementId: e.target.value || null })}
                          className="w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-amber-400/40"
                        >
                          <option value="">No anchor</option>
                          {settlements.map((entry) => (
                            <option key={entry.id} value={entry.id}>{entry.name}</option>
                          ))}
                        </select>
                        <Button size="sm" variant="secondary" onClick={absorbSettlement} disabled={readOnly || !selectedData.primarySettlementId}>
                          Absorb
                        </Button>
                      </div>
                    </FormField>
                    <TableEditor
                      title="POI Ledger"
                      columns={TABLE_COLUMNS.poiLedger}
                      rows={normalizeTableRows(selectedData.poiLedger, TABLE_COLUMNS.poiLedger)}
                      onChange={(next) => setTable("poiLedger", next)}
                      addLabel="+ POI"
                      readOnly={readOnly}
                    />
                    <TableEditor
                      title="Transit Spokes"
                      columns={TABLE_COLUMNS.transitSpokes}
                      rows={normalizeTableRows(selectedData.transitSpokes, TABLE_COLUMNS.transitSpokes)}
                      onChange={(next) => setTable("transitSpokes", next)}
                      addLabel="+ Route"
                      readOnly={readOnly}
                    />

                    <MultiLinkEditor
                      label="Linked Cultures"
                      options={cultures}
                      value={normalizeStringArray(selectedData.cultureIds)}
                      onChange={(next) => patchData({ cultureIds: next })}
                      placeholder="Choose culture..."
                      readOnly={readOnly}
                    />
                    <FormField label="Primary Culture Anchor" htmlFor="geo-pri-culture">
                      <div className="flex gap-2">
                        <select
                          id="geo-pri-culture"
                          value={selectedData.primaryCultureId ?? ""}
                          disabled={readOnly}
                          onChange={(e) => patchData({ primaryCultureId: e.target.value || null })}
                          className="w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-amber-400/40"
                        >
                          <option value="">No anchor</option>
                          {cultures.map((entry) => (
                            <option key={entry.id} value={entry.id}>{entry.name}</option>
                          ))}
                        </select>
                        <Button size="sm" variant="secondary" onClick={absorbCulture} disabled={readOnly || !selectedData.primaryCultureId}>
                          Absorb
                        </Button>
                      </div>
                    </FormField>
                    <TableEditor
                      title="Cultural Tensions"
                      columns={TABLE_COLUMNS.culturalTensions}
                      rows={normalizeTableRows(selectedData.culturalTensions, TABLE_COLUMNS.culturalTensions)}
                      onChange={(next) => setTable("culturalTensions", next)}
                      addLabel="+ Tension"
                      readOnly={readOnly}
                    />

                    <MultiLinkEditor
                      label="Linked Dungeons / Ruins"
                      options={dungeons}
                      value={normalizeStringArray(selectedData.dungeonIds)}
                      onChange={(next) => patchData({ dungeonIds: next })}
                      placeholder="Choose dungeon..."
                      readOnly={readOnly}
                    />
                    <FormField label="Primary Ruin Anchor" htmlFor="geo-pri-dungeon">
                      <div className="flex gap-2">
                        <select
                          id="geo-pri-dungeon"
                          value={selectedData.primaryDungeonId ?? ""}
                          disabled={readOnly}
                          onChange={(e) => patchData({ primaryDungeonId: e.target.value || null })}
                          className="w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-amber-400/40"
                        >
                          <option value="">No anchor</option>
                          {dungeons.map((entry) => (
                            <option key={entry.id} value={entry.id}>{entry.name}</option>
                          ))}
                        </select>
                        <Button size="sm" variant="secondary" onClick={absorbDungeon} disabled={readOnly || !selectedData.primaryDungeonId}>
                          Absorb
                        </Button>
                      </div>
                    </FormField>
                    <TableEditor
                      title="Ruin Hotspots"
                      columns={TABLE_COLUMNS.ruinHotspots}
                      rows={normalizeTableRows(selectedData.ruinHotspots, TABLE_COLUMNS.ruinHotspots)}
                      onChange={(next) => setTable("ruinHotspots", next)}
                      addLabel="+ Hotspot"
                      readOnly={readOnly}
                    />
                    <TableEditor
                      title="Delve Consequences"
                      columns={TABLE_COLUMNS.delveConsequences}
                      rows={normalizeTableRows(selectedData.delveConsequences, TABLE_COLUMNS.delveConsequences)}
                      onChange={(next) => setTable("delveConsequences", next)}
                      addLabel="+ Consequence"
                      readOnly={readOnly}
                    />
                  </div>
                ) : null}

                {activeTab === "routes" ? (
                  <div className="space-y-4">
                    <MultiLinkEditor
                      label="Linked Economy Models"
                      options={economy}
                      value={normalizeStringArray(selectedData.economyIds)}
                      onChange={(next) => patchData({ economyIds: next })}
                      placeholder="Choose economy model..."
                      readOnly={readOnly}
                    />
                    <FormField label="Primary Economy Anchor" htmlFor="geo-pri-econ">
                      <div className="flex gap-2">
                        <select
                          id="geo-pri-econ"
                          value={selectedData.primaryEconomyId ?? ""}
                          disabled={readOnly}
                          onChange={(e) => patchData({ primaryEconomyId: e.target.value || null })}
                          className="w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-amber-400/40"
                        >
                          <option value="">No anchor</option>
                          {economy.map((entry) => (
                            <option key={entry.id} value={entry.id}>{entry.name}</option>
                          ))}
                        </select>
                        <Button size="sm" variant="secondary" onClick={absorbEconomy} disabled={readOnly || !selectedData.primaryEconomyId}>
                          Absorb
                        </Button>
                      </div>
                    </FormField>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Resources" htmlFor="geo-resources">
                        <textarea
                          id="geo-resources"
                          className="w-full min-h-[96px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                          value={selectedData.resources ?? ""}
                          disabled={readOnly}
                          onChange={(e) => patchData({ resources: e.target.value })}
                        />
                      </FormField>
                      <FormField label="Scarcity Pressure" htmlFor="geo-scarcity">
                        <textarea
                          id="geo-scarcity"
                          className="w-full min-h-[96px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                          value={selectedData.scarcityPressure ?? ""}
                          disabled={readOnly}
                          onChange={(e) => patchData({ scarcityPressure: e.target.value })}
                        />
                      </FormField>
                    </div>
                    <FormField label="Market Levers" htmlFor="geo-levers">
                      <textarea
                        id="geo-levers"
                        className="w-full min-h-[88px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selectedData.marketLevers ?? ""}
                        disabled={readOnly}
                        onChange={(e) => patchData({ marketLevers: e.target.value })}
                      />
                    </FormField>
                    <TableEditor
                      title="Trade Routes"
                      columns={TABLE_COLUMNS.tradeRoutes}
                      rows={normalizeTableRows(selectedData.tradeRoutes, TABLE_COLUMNS.tradeRoutes)}
                      onChange={(next) => setTable("tradeRoutes", next)}
                      addLabel="+ Trade Route"
                      readOnly={readOnly}
                    />
                  </div>
                ) : null}

                {activeTab === "script" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Controlling Faction" htmlFor="geo-faction">
                        <select
                          id="geo-faction"
                          value={selectedData.controllingFactionId ?? ""}
                          disabled={readOnly}
                          onChange={(e) => patchData({ controllingFactionId: e.target.value || null })}
                          className="w-full rounded-2xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-amber-400/40"
                        >
                          <option value="">No controlling faction</option>
                          {factions.map((entry) => (
                            <option key={entry.id} value={entry.id}>{entry.name}</option>
                          ))}
                        </select>
                      </FormField>
                      <MultiLinkEditor
                        label="Key NPCs"
                        options={npcs}
                        value={normalizeStringArray(selectedData.keyNpcIds)}
                        onChange={(next) => patchData({ keyNpcIds: next })}
                        placeholder="Choose NPC..."
                        readOnly={readOnly}
                      />
                    </div>
                    <TableEditor
                      title="Travel Script"
                      columns={TABLE_COLUMNS.travelScript}
                      rows={normalizeTableRows(selectedData.travelScript, TABLE_COLUMNS.travelScript)}
                      onChange={(next) => setTable("travelScript", next)}
                      addLabel="+ Beat"
                      readOnly={readOnly}
                    />
                    <TableEditor
                      title="Event Clock"
                      columns={TABLE_COLUMNS.eventClock}
                      rows={normalizeTableRows(selectedData.eventClock, TABLE_COLUMNS.eventClock)}
                      onChange={(next) => setTable("eventClock", next)}
                      addLabel="+ Phase"
                      readOnly={readOnly}
                    />
                    <FormField label="Session Openers" htmlFor="geo-openers">
                      <textarea
                        id="geo-openers"
                        className="w-full min-h-[96px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selectedData.sessionOpeners ?? ""}
                        disabled={readOnly}
                        onChange={(e) => patchData({ sessionOpeners: e.target.value })}
                      />
                    </FormField>
                    <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/5 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-emerald-100">Script Runner</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setScriptCursor((prev) => (scriptBeats.length ? (prev - 1 + scriptBeats.length) % scriptBeats.length : 0))}
                            disabled={scriptBeats.length === 0}
                          >
                            Prev
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setScriptCursor((prev) => (scriptBeats.length ? (prev + 1) % scriptBeats.length : 0))}
                            disabled={scriptBeats.length === 0}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                      {currentBeat ? (
                        <div className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-2">
                          <p className="text-xs uppercase tracking-wide text-zinc-400">{`${currentBeat.label} (${scriptCursor + 1}/${scriptBeats.length})`}</p>
                          <p className="text-sm text-zinc-100"><span className="text-zinc-400">Trigger: </span>{currentBeat.trigger}</p>
                          <p className="text-sm text-zinc-100"><span className="text-zinc-400">Beat: </span>{currentBeat.beat}</p>
                          <p className="text-sm text-zinc-100"><span className="text-zinc-400">Consequence: </span>{currentBeat.consequence}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500">Add travel or clock rows to run this region.</p>
                      )}
                    </div>
                  </div>
                ) : null}

                {activeTab === "preview" ? (
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-wide text-cyan-200/80">Scripted Region View</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div className="rounded-xl border border-white/10 bg-black/35 p-2"><p className="text-[11px] text-zinc-400">Scale</p><p className="text-xs text-zinc-100">{displayScale(selectedData)}</p></div>
                      <div className="rounded-xl border border-white/10 bg-black/35 p-2"><p className="text-[11px] text-zinc-400">Biome</p><p className="text-xs text-zinc-100">{selectedData.biome ?? "-"}</p></div>
                      <div className="rounded-xl border border-white/10 bg-black/35 p-2"><p className="text-[11px] text-zinc-400">Climate</p><p className="text-xs text-zinc-100">{selectedData.climate ?? "-"}</p></div>
                      <div className="rounded-xl border border-white/10 bg-black/35 p-2"><p className="text-[11px] text-zinc-400">Risk</p><p className="text-xs text-zinc-100">{`${metrics.riskBand} (${metrics.risk}/100)`}</p></div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/35 p-2">
                      <p className="text-[11px] text-zinc-400">Description</p>
                      <p className="text-xs text-zinc-100">{selectedData.description ?? "-"}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded-xl border border-white/10 bg-black/35 p-2"><p className="text-[11px] text-zinc-400">Settlements</p><p className="text-xs text-zinc-100">{namesFrom(normalizeStringArray(selectedData.settlementIds), settlements) || "-"}</p></div>
                      <div className="rounded-xl border border-white/10 bg-black/35 p-2"><p className="text-[11px] text-zinc-400">Cultures</p><p className="text-xs text-zinc-100">{namesFrom(normalizeStringArray(selectedData.cultureIds), cultures) || "-"}</p></div>
                      <div className="rounded-xl border border-white/10 bg-black/35 p-2"><p className="text-[11px] text-zinc-400">Dungeons</p><p className="text-xs text-zinc-100">{namesFrom(normalizeStringArray(selectedData.dungeonIds), dungeons) || "-"}</p></div>
                      <div className="rounded-xl border border-white/10 bg-black/35 p-2"><p className="text-[11px] text-zinc-400">Economy</p><p className="text-xs text-zinc-100">{namesFrom(normalizeStringArray(selectedData.economyIds), economy) || "-"}</p></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
                        <p className="text-[11px] text-zinc-400">Trade Routes</p>
                        <ul className="mt-1 list-disc pl-4 text-xs text-zinc-100 space-y-1">
                          {previewLines(normalizeTableRows(selectedData.tradeRoutes, TABLE_COLUMNS.tradeRoutes), TABLE_COLUMNS.tradeRoutes).map((line) => (<li key={`route-${line}`}>{line}</li>))}
                          {normalizeTableRows(selectedData.tradeRoutes, TABLE_COLUMNS.tradeRoutes).length === 0 ? <li className="list-none text-zinc-500">No trade routes.</li> : null}
                        </ul>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
                        <p className="text-[11px] text-zinc-400">Script Beats</p>
                        <ul className="mt-1 list-disc pl-4 text-xs text-zinc-100 space-y-1">
                          {previewLines(normalizeTableRows(selectedData.travelScript, TABLE_COLUMNS.travelScript), TABLE_COLUMNS.travelScript).map((line) => (<li key={`beat-${line}`}>{line}</li>))}
                          {normalizeTableRows(selectedData.travelScript, TABLE_COLUMNS.travelScript).length === 0 ? <li className="list-none text-zinc-500">No beats scripted.</li> : null}
                        </ul>
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/35 p-2">
                      <p className="text-[11px] text-zinc-400">Controlling Faction / Key NPCs</p>
                      <p className="text-xs text-zinc-100">{factionNameById.get(selectedData.controllingFactionId ?? "") ?? "-"}</p>
                      <p className="text-xs text-zinc-400 mt-1">{normalizeStringArray(selectedData.keyNpcIds).map((id) => npcNameById.get(id) ?? id).join(", ") || "No key NPCs linked."}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
