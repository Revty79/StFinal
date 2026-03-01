"use client";

import {
  ToolboxCrudBuilder,
  type PreviewHighlight,
  type ToolFieldGroup,
  type ToolPreset,
  type RelatedToolLink,
  type ToolRecord,
} from "@/components/worldbuilder/ToolboxCrudBuilder";
import { previewCsv, previewFirstRows, previewText } from "@/lib/worldbuilderPreview";

const fieldGroups: ToolFieldGroup[] = [
  {
    title: "Identity",
    description: "What this faction is and how it presents itself.",
    fields: [
      { key: "type", label: "Faction Type", placeholder: "guild, empire, cult, crime syndicate..." },
      { key: "goals", label: "Goals", rows: 4 },
    ],
  },
  {
    title: "Strategy",
    description: "How power is actually exercised.",
    fields: [
      { key: "methods", label: "Methods", rows: 4 },
      { key: "resources", label: "Resources", rows: 4 },
      { key: "territory", label: "Territory", rows: 4 },
      {
        key: "leaderNpcId",
        label: "Leader NPC",
        relation: {
          endpoint: "/api/worldbuilder/npcs",
          listKey: "npcs",
        },
      },
    ],
  },
  {
    title: "Alliances & Conflicts",
    description: "Cross-links to other factions and hooks.",
    fields: [
      {
        key: "allies",
        label: "Allied Factions",
        kind: "csv",
        relation: {
          endpoint: "/api/worldbuilder/factions",
          listKey: "factions",
          multi: true,
          excludeCurrentItem: true,
        },
      },
      {
        key: "enemies",
        label: "Enemy Factions",
        kind: "csv",
        relation: {
          endpoint: "/api/worldbuilder/factions",
          listKey: "factions",
          multi: true,
          excludeCurrentItem: true,
        },
      },
      {
        key: "hooks",
        label: "Plot Hooks",
        kind: "csv",
        relation: {
          endpoint: "/api/worldbuilder/plot-hooks",
          listKey: "plotHooks",
          multi: true,
        },
      },
    ],
  },
  {
    title: "Fronts",
    description: "Escalation tracks that show what happens if unchecked.",
    fields: [
      {
        key: "fronts",
        label: "Front Tracks",
        kind: "table",
        description: "One row per front: title | step1 | step2 | step3",
        placeholder: "Smuggler Ring | Expand docks | Buy officials | Control customs",
        tableColumns: ["title", "step1", "step2", "step3"],
      },
      { key: "notes", label: "Notes", rows: 5 },
    ],
  },
];

const relatedTools: RelatedToolLink[] = [
  { label: "NPCs", href: "/worldbuilder/npcs", note: "Use for leadership, lieutenants, and notable agents." },
  { label: "Plot Hooks", href: "/worldbuilder/plot-hooks", note: "Attach factions directly to active story seeds." },
  { label: "Geography", href: "/worldbuilder/geography", note: "Mark faction control zones and contested regions." },
  { label: "Settlements", href: "/worldbuilder/settlements", note: "Connect seats of power and local influence." },
  { label: "Timeline", href: "/worldbuilder/timeline", note: "Track coups, treaties, and wars across eras." },
];


const presets: ToolPreset[] = [
  {
    label: "Merchant League",
    summary: "Trade cartel with legal reach and quiet coercion.",
    name: "The Sapphire Ledger",
    tagline: "Coin first, crowns second.",
    data: {
      type: "guild",
      goals: "Lock down maritime tariffs and monopolize caravan insurance.",
      methods: "Debt leverage, bribery, selective embargoes.",
      resources: "Merchant fleets, counting houses, private guards.",
      territory: "Major ports and river crossings.",
      allies: [],
      enemies: [],
    },
  },
  {
    label: "Holy Inquisition",
    summary: "Faith-backed enforcers hunting heresy and forbidden rites.",
    name: "The Ashen Synod",
    tagline: "Purity by witness and flame.",
    data: {
      type: "cult",
      goals: "Erase relic cults and centralize all sanctioned worship.",
      methods: "Public trials, confiscation, covert informants.",
      resources: "Temple courts, confession records, relic vaults.",
      territory: "Pilgrimage roads and cathedral districts.",
      hooks: [],
    },
  },
  {
    label: "Imperial Remnant",
    summary: "Fallen military hierarchy trying to reclaim authority.",
    name: "The Ninth Standard",
    tagline: "Order survives the throne.",
    data: {
      type: "empire",
      goals: "Restore old borders and secure veteran loyalty.",
      methods: "Military governance, oath-binding patronage, war taxes.",
      resources: "Fortified depots, veteran cohorts, siege stockpiles.",
      territory: "Border marches and captured forts.",
      fronts: [{ title: "Restoration Campaign", step1: "Secure supply roads", step2: "Retake key fortresses", step3: "Declare martial law" }],
    },
  },
];

const previewHighlights: PreviewHighlight[] = [
  { label: "Faction Type", key: "type" },
  { label: "Primary Goals", key: "goals" },
  { label: "Operational Methods", key: "methods" },
  { label: "Enemies", key: "enemies", kind: "csv" },
  { label: "Front Tracks", key: "fronts", kind: "table" },
];

export default function FactionsPage() {
  const renderPreview = (entry: ToolRecord) => (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-indigo-200/80">Faction Dossier</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Type</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.type)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Leader</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.leaderNpcId)}</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Operational Goal</p>
        <p className="text-xs text-zinc-100">{previewText(entry.data?.goals)}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Known Allies / Enemies</p>
        <p className="text-xs text-zinc-100">
          Allies: {previewCsv(entry.data?.allies)} | Enemies: {previewCsv(entry.data?.enemies)}
        </p>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Front Escalation Snapshot</p>
        <ul className="mt-1 list-disc pl-4 text-xs text-zinc-100 space-y-1">
          {previewFirstRows(entry.data?.fronts, ["title", "step1", "step2", "step3"]).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <ToolboxCrudBuilder
      navKey="factions"
      title="Factions"
      description="Design power blocs, secret orders, and rival institutions that move your world."
      flavorLine="Faction entries work best when they have a clear goal, a public face, and a private method."
      endpoint="/api/worldbuilder/factions"
      listKey="factions"
      itemKey="faction"
      singularLabel="Faction"
      pluralLabel="Factions"
      fieldGroups={fieldGroups}
      relatedTools={relatedTools}
      presets={presets}
      previewHighlights={previewHighlights}
      tabLabels={{ edit: "Command Table", preview: "Dossier" }}
      editHint="Tip: Keep faction entries action-oriented. Methods and fronts should create scenes, not just lore."
      renderPreview={renderPreview}
      theme={{
        activeCardClass: "border-indigo-400/50 bg-indigo-500/10",
        panelClass: "border-indigo-300/25",
        sectionClass: "border-indigo-400/20",
        badgeClass: "text-indigo-200/90",
      }}
    />
  );
}

