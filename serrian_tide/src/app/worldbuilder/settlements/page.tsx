"use client";

import {
  ToolboxCrudBuilder,
  type PreviewHighlight,
  type ToolFieldGroup,
  type ToolPreset,
  type RelatedToolLink,
  type ToolRecord,
} from "@/components/worldbuilder/ToolboxCrudBuilder";
import { previewText } from "@/lib/worldbuilderPreview";

const fieldGroups: ToolFieldGroup[] = [
  {
    title: "Settlement Identity",
    description: "High-level profile for fast reuse in sessions.",
    fields: [
      { key: "settlementType", label: "Settlement Type", placeholder: "city, fort, hamlet, temple..." },
      { key: "populationScale", label: "Population Scale" },
      {
        key: "geographyId",
        label: "Geography",
        relation: {
          endpoint: "/api/worldbuilder/geography",
          listKey: "geography",
        },
      },
    ],
  },
  {
    title: "Power & Systems",
    description: "How this place stays alive and who controls it.",
    fields: [
      { key: "government", label: "Government", rows: 3 },
      { key: "economy", label: "Economy", rows: 3 },
      { key: "defenses", label: "Defenses", rows: 3 },
      {
        key: "controllingFactionId",
        label: "Controlling Faction",
        relation: {
          endpoint: "/api/worldbuilder/factions",
          listKey: "factions",
        },
      },
    ],
  },
  {
    title: "District Drama",
    description: "The playable tension inside the settlement.",
    fields: [
      { key: "districts", label: "Districts", rows: 4 },
      { key: "problems", label: "Problems", rows: 4 },
      { key: "secrets", label: "Secrets", rows: 4 },
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
  { label: "Geography", href: "/worldbuilder/geography", note: "Attach each settlement to a specific regional context." },
  { label: "Factions", href: "/worldbuilder/factions", note: "Connect ruling, criminal, or religious influence." },
  { label: "NPCs", href: "/worldbuilder/npcs", note: "Reference mayors, ward bosses, and local heroes." },
  { label: "Economy", href: "/worldbuilder/economy", note: "Reuse trade, pricing, and scarcity assumptions." },
  { label: "Plot Hooks", href: "/worldbuilder/plot-hooks", note: "Seed immediate adventures from local tensions." },
];


const presets: ToolPreset[] = [
  {
    label: "Frontier Fort",
    summary: "Military outpost guarding a contested route.",
    name: "Stonewake Bastion",
    tagline: "Last wall before the wild marches.",
    data: {
      settlementType: "fort",
      populationScale: "small garrison town",
      government: "Commandant-led martial administration.",
      economy: "Supply caravans, smithing, contracted scouts.",
      defenses: "Curtain walls, signal towers, mounted patrols.",
      districts: "Inner keep, barracks row, market square, caravan yard.",
      problems: "Supply theft, deserters, and false alarm beacons.",
      secrets: "A sealed tunnel exits beyond the siege line.",
    },
  },
  {
    label: "Temple City",
    summary: "Pilgrimage center dominated by ritual calendar.",
    name: "Lumen Vale",
    tagline: "Every street leads to a vow.",
    data: {
      settlementType: "city",
      populationScale: "large pilgrimage city",
      government: "Dual rule: temple synod and merchant magistrates.",
      economy: "Pilgrim services, relic trade, scribal copies.",
      defenses: "Militia orders and sacred ward circuits.",
      districts: "Pilgrim quarter, old archives, sanctum terraces.",
      problems: "Doctrinal unrest and counterfeit relic markets.",
      secrets: "A forbidden shrine remains active beneath the central basilica.",
    },
  },
  {
    label: "Smuggler Port",
    summary: "Prosperous harbor built on legal gray zones.",
    name: "Cinder Quay",
    tagline: "Ships dock clean, manifests do not.",
    data: {
      settlementType: "port city",
      populationScale: "dense coastal metro",
      government: "Council oligarchy influenced by shipping syndicates.",
      economy: "Transit fees, contraband, repair docks.",
      defenses: "Harbor chains, private marine companies, lighthouse guns.",
      districts: "Docksprawl, chain market, upper terraces.",
      problems: "Customs violence and tariff wars.",
      secrets: "Harbor records are altered nightly by a hidden clerk network.",
    },
  },
];

const previewHighlights: PreviewHighlight[] = [
  { label: "Settlement Type", key: "settlementType" },
  { label: "Population Scale", key: "populationScale" },
  { label: "Government", key: "government" },
  { label: "Local Problems", key: "problems" },
  { label: "Key NPCs", key: "keyNpcIds", kind: "csv" },
];

export default function SettlementsPage() {
  const renderPreview = (entry: ToolRecord) => (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-orange-200/80">Settlement Sheet</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Type</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.settlementType)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Population</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.populationScale)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Government</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.government)}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Primary Problem</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.problems)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Key Secret</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.secrets)}</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">District Snapshot</p>
        <p className="text-xs text-zinc-100">{previewText(entry.data?.districts)}</p>
      </div>
    </div>
  );

  return (
    <ToolboxCrudBuilder
      navKey="settlements"
      title="Settlements & Points of Interest"
      description="Craft location hubs with social pressure, political control, and ready-to-play conflicts."
      flavorLine="A good settlement entry should tell you where danger lives before players arrive."
      endpoint="/api/worldbuilder/settlements"
      listKey="settlements"
      itemKey="settlement"
      singularLabel="Settlement"
      pluralLabel="Settlements"
      fieldGroups={fieldGroups}
      relatedTools={relatedTools}
      presets={presets}
      previewHighlights={previewHighlights}
      tabLabels={{ edit: "Civic Planner", preview: "Town Sheet" }}
      editHint="Tip: If the party arrives tonight, your problem and secret fields should instantly drive play."
      renderPreview={renderPreview}
      theme={{
        activeCardClass: "border-orange-400/50 bg-orange-500/10",
        panelClass: "border-orange-300/25",
        sectionClass: "border-orange-400/20",
        badgeClass: "text-orange-200/90",
      }}
    />
  );
}

