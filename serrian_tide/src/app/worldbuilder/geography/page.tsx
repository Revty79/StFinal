"use client";

import {
  ToolboxCrudBuilder,
  type PreviewHighlight,
  type ToolFieldGroup,
  type RelatedToolLink,
  type ToolRecord,
} from "@/components/worldbuilder/ToolboxCrudBuilder";
import { previewCsv, previewText } from "@/lib/worldbuilderPreview";

const SCALE_OPTIONS = [
  { value: "world", label: "World" },
  { value: "continent", label: "Continent" },
  { value: "region", label: "Region" },
  { value: "province", label: "Province" },
  { value: "district", label: "District" },
  { value: "location", label: "Location" },
  { value: "poi", label: "Point of Interest" },
  { value: "other", label: "Other (Custom)" },
] as const;

const HIERARCHY_PARENT_SCALES: Record<string, string[]> = {
  world: [],
  continent: ["world"],
  region: ["continent"],
  province: ["region"],
  district: ["province", "region"],
  location: ["district", "province", "region"],
  poi: ["location", "district"],
  other: ["world", "continent", "region", "province", "district", "location", "poi"],
};

function getEffectiveScale(value: unknown, fallbackOther: unknown): string {
  const scale = String(value ?? "").trim().toLowerCase();
  if (scale === "other") {
    return String(fallbackOther ?? "").trim().toLowerCase();
  }
  return scale;
}

const NEXT_CHILD_SCALE_BY_PARENT: Record<string, string> = {
  world: "continent",
  continent: "region",
  region: "province",
  province: "district",
  district: "location",
  location: "poi",
  poi: "other",
};

function getRecordData(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

function getCsv(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function buildParentPopulatePatch(option: ToolRecord, current: ToolRecord | null): Record<string, unknown> {
  const parentData = getRecordData(option.data);
  const childData = getRecordData(current?.data);
  const patch: Record<string, unknown> = {};

  if (isEmptyValue(childData.biome) && !isEmptyValue(parentData.biome)) {
    patch.biome = parentData.biome;
  }
  if (isEmptyValue(childData.climate) && !isEmptyValue(parentData.climate)) {
    patch.climate = parentData.climate;
  }
  if (isEmptyValue(childData.controllingFactionId) && !isEmptyValue(parentData.controllingFactionId)) {
    patch.controllingFactionId = parentData.controllingFactionId;
  }

  const mergedTags = Array.from(new Set([...getCsv(childData.tags), ...getCsv(parentData.tags)]));
  if (mergedTags.length > 0) {
    patch.tags = mergedTags;
  }

  if (isEmptyValue(childData.description)) {
    patch.description = `Subregion of ${option.name}.`;
  }

  return patch;
}

function buildChildFromParent(parent: ToolRecord): Partial<ToolRecord> {
  const parentData = getRecordData(parent.data);
  const parentScale = String(parentData.scale ?? "").trim().toLowerCase();
  const nextScale = NEXT_CHILD_SCALE_BY_PARENT[parentScale] ?? "other";
  const parentCustomScale = String(parentData.scaleOther ?? "").trim();

  return {
    name: `${parent.name} - New Area`,
    tagline: "",
    isFree: parent.isFree ?? true,
    isPublished: false,
    data: {
      parentId: String(parent.id),
      scale: nextScale,
      scaleOther:
        nextScale === "other"
          ? (parentScale === "other" && parentCustomScale ? `${parentCustomScale} sub-area` : "")
          : null,
      biome: parentData.biome ?? null,
      climate: parentData.climate ?? null,
      controllingFactionId: parentData.controllingFactionId ?? null,
      tags: getCsv(parentData.tags),
      description: `Subregion of ${parent.name}.`,
    },
  };
}

const fieldGroups: ToolFieldGroup[] = [
  {
    title: "Placement & Scale",
    description: "Step 1: set scale. Step 2: assign a valid parent. Step 3: write descriptive map notes.",
    fields: [
      {
        key: "scale",
        label: "Scale",
        kind: "select",
        options: SCALE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
        placeholder: "Choose hierarchy scale",
        description: "Choose where this entry sits in the map stack.",
      },
      {
        key: "scaleOther",
        label: "Custom Scale",
        placeholder: "Type your custom scale label",
        rows: 1,
        visibleWhen: { fieldKey: "scale", equals: "other" },
      },
      {
        key: "parentId",
        label: "Parent Geography",
        description: "Only valid parent scales appear based on the selected scale.",
        visibleWhen: {
          fieldKey: "scale",
          oneOf: ["continent", "region", "province", "district", "location", "poi", "other"],
        },
        relation: {
          endpoint: "/api/worldbuilder/geography",
          listKey: "geography",
          excludeCurrentItem: true,
          onSelectPopulate: buildParentPopulatePatch,
          filterOptions: (option, current) => {
            if (!current) return true;

            const currentScale = getEffectiveScale(current.data?.scale, current.data?.scaleOther);
            if (!currentScale) return true;

            const allowedParents = HIERARCHY_PARENT_SCALES[currentScale];
            if (!allowedParents) return true;
            if (allowedParents.length === 0) return false;

            const optionScale = getEffectiveScale(
              (option.data as Record<string, unknown> | null)?.scale,
              (option.data as Record<string, unknown> | null)?.scaleOther
            );

            return allowedParents.includes(optionScale);
          },
        },
      },
      { key: "description", label: "Description", rows: 5 },
    ],
  },
  {
    title: "Environment",
    description: "Physical and travel-facing details.",
    fields: [
      { key: "biome", label: "Biome" },
      { key: "climate", label: "Climate" },
      { key: "travelNotes", label: "Travel Notes", rows: 4 },
      { key: "hazards", label: "Hazards", rows: 4 },
      { key: "resources", label: "Resources", rows: 4 },
      { key: "tags", label: "Tags", kind: "csv", placeholder: "coastal, cursed, trade-route..." },
    ],
  },
  {
    title: "Control & Population",
    description: "Cross-link controlling factions and key NPC anchors.",
    fields: [
      {
        key: "controllingFactionId",
        label: "Controlling Faction",
        relation: {
          endpoint: "/api/worldbuilder/factions",
          listKey: "factions",
        },
      },
      {
        key: "keyNpcIds",
        label: "Key NPCs",
        kind: "csv",
        relation: {
          endpoint: "/api/worldbuilder/npcs",
          listKey: "npcs",
          multi: true,
        },
      },
    ],
  },
];

const relatedTools: RelatedToolLink[] = [
  { label: "Settlements", href: "/worldbuilder/settlements", note: "Anchor this area with towns, forts, and POIs." },
  { label: "Encounters", href: "/worldbuilder/encounters", note: "Attach biome-specific travel and encounter logic." },
  { label: "Factions", href: "/worldbuilder/factions", note: "Track political or military control over regions." },
  { label: "Economy", href: "/worldbuilder/economy", note: "Connect trade corridors and scarcity patterns." },
  { label: "Timeline", href: "/worldbuilder/timeline", note: "Record historical shifts in borders and ownership." },
];


const previewHighlights: PreviewHighlight[] = [
  { label: "Scale", key: "scale" },
  { label: "Biome", key: "biome" },
  { label: "Climate", key: "climate" },
  { label: "Hazards", key: "hazards" },
  { label: "Tags", key: "tags", kind: "csv" },
];

export default function GeographyPage() {
  const previewScale = (entry: ToolRecord) => {
    const scale = String(entry.data?.scale ?? "").trim().toLowerCase();
    if (scale === "other") {
      return previewText(entry.data?.scaleOther);
    }
    return previewText(entry.data?.scale);
  };

  const renderPreview = (entry: ToolRecord) => (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-emerald-200/80">Field Notes</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Scale</p>
          <p className="text-xs text-zinc-100">{previewScale(entry)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Biome</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.biome)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Climate</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.climate)}</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Travel Advisory</p>
        <p className="text-xs text-zinc-100">{previewText(entry.data?.travelNotes)}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Hazards</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.hazards)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Resources</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.resources)}</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Tags</p>
        <p className="text-xs text-zinc-100">{previewCsv(entry.data?.tags)}</p>
      </div>
    </div>
  );

  return (
    <ToolboxCrudBuilder
      navKey="geography"
      title="Geography & Regions"
      description="Map the physical canvas of your world, from continents down to isolated ruins."
      flavorLine="Treat each entry as a reusable map pin with atmosphere, danger, and strategic value."
      endpoint="/api/worldbuilder/geography"
      listKey="geography"
      itemKey="geography"
      singularLabel="Geography Entry"
      pluralLabel="Geography Entries"
      fieldGroups={fieldGroups}
      relatedTools={relatedTools}
      previewHighlights={previewHighlights}
      tabLabels={{ edit: "Cartographer", preview: "Field Notes" }}
      editHint="Hierarchy flow: choose Scale first, then pick Parent Geography from one level above, then fill environment details."
      createFromSelected={{
        label: "Add Child Geography",
        build: buildChildFromParent,
      }}
      renderPreview={renderPreview}
      theme={{
        activeCardClass: "border-emerald-400/50 bg-emerald-500/10",
        panelClass: "border-emerald-300/25",
        sectionClass: "border-emerald-400/20",
        badgeClass: "text-emerald-200/90",
      }}
    />
  );
}

