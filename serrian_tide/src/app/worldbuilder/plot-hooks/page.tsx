"use client";

import {
  ToolboxCrudBuilder,
  type PreviewHighlight,
  type ToolFieldGroup,
  type ToolPreset,
  type RelatedToolLink,
  type ToolRecord,
} from "@/components/worldbuilder/ToolboxCrudBuilder";
import { previewCsv, previewText } from "@/lib/worldbuilderPreview";

const fieldGroups: ToolFieldGroup[] = [
  {
    title: "Core Hook",
    description: "The pitch and why players should care.",
    fields: [
      { key: "premise", label: "Premise", rows: 4 },
      { key: "stakes", label: "Stakes", rows: 4 },
      { key: "tags", label: "Tags", kind: "csv", placeholder: "mystery, politics, wilderness..." },
    ],
  },
  {
    title: "Cast & Location",
    description: "Attach the hook to world assets you already built.",
    fields: [
      {
        key: "locationGeographyId",
        label: "Location Geography",
        relation: {
          endpoint: "/api/worldbuilder/geography",
          listKey: "geography",
        },
      },
      {
        key: "antagonistFactionId",
        label: "Antagonist Faction",
        relation: {
          endpoint: "/api/worldbuilder/factions",
          listKey: "factions",
        },
      },
      {
        key: "npcIds",
        label: "Related NPCs",
        kind: "csv",
        relation: {
          endpoint: "/api/worldbuilder/npcs",
          listKey: "npcs",
          multi: true,
        },
      },
    ],
  },
  {
    title: "Resolution Pressure",
    description: "What happens if they engage, and if they do not.",
    fields: [
      { key: "rewards", label: "Rewards", rows: 4 },
      { key: "complications", label: "Complications", rows: 4 },
      { key: "ifIgnored", label: "If Ignored", rows: 4 },
    ],
  },
];

const relatedTools: RelatedToolLink[] = [
  { label: "NPCs", href: "/worldbuilder/npcs", note: "Use named actors as patrons, victims, or antagonists." },
  { label: "Factions", href: "/worldbuilder/factions", note: "Tie hooks to faction agendas and fronts." },
  { label: "Geography", href: "/worldbuilder/geography", note: "Ground each hook in a specific location." },
  { label: "Dungeons", href: "/worldbuilder/dungeons", note: "Convert hooks into sites with procedural tables." },
  { label: "Timeline", href: "/worldbuilder/timeline", note: "Track outcomes as canonical world events." },
];


const presets: ToolPreset[] = [
  {
    label: "Missing Caravan",
    summary: "Disappearance on a dangerous route with economic fallout.",
    name: "The Silent Convoy",
    tagline: "Three wagons vanished between mile-markers.",
    data: {
      premise: "A supply caravan failed to arrive, and both guilds blame sabotage.",
      stakes: "If supplies do not arrive, winter contracts collapse and riots start.",
      rewards: "Debt forgiveness, travel charters, and a permanent guild contact.",
      complications: "Witnesses lie; one wagon never existed in official records.",
      ifIgnored: "Black market cartels seize control of ration distribution.",
      tags: ["investigation", "trade", "wilderness"],
    },
  },
  {
    label: "Court Intrigue",
    summary: "Political scandal weaponized before a succession vote.",
    name: "The Fifth Vote",
    tagline: "One council seat will decide a kingdom.",
    data: {
      premise: "A forged decree could install a puppet regent before dawn.",
      stakes: "A hostile bloc gains legal authority over military command.",
      rewards: "Noble patronage, titles, and access to restricted archives.",
      complications: "Real decrees were also altered by someone else.",
      ifIgnored: "Emergency powers become permanent law.",
      tags: ["politics", "social", "espionage"],
    },
  },
  {
    label: "Forbidden Dig",
    summary: "Scholars open a site that should have stayed sealed.",
    name: "The Ninth Seal",
    tagline: "Excavation wakes what history buried.",
    data: {
      premise: "A funded expedition unsealed a ruin and stopped sending reports.",
      stakes: "Whatever escaped is moving toward populated roads.",
      rewards: "Relics, exclusive research rights, and faction favor.",
      complications: "The sponsor wants evidence buried, not exposed.",
      ifIgnored: "Peripheral settlements start disappearing overnight.",
      tags: ["dungeon", "horror", "mystery"],
    },
  },
];

const previewHighlights: PreviewHighlight[] = [
  { label: "Premise", key: "premise" },
  { label: "Stakes", key: "stakes" },
  { label: "Complications", key: "complications" },
  { label: "If Ignored", key: "ifIgnored" },
  { label: "Tags", key: "tags", kind: "csv" },
];

export default function PlotHooksPage() {
  const renderPreview = (entry: ToolRecord) => (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-pink-200/80">Session Card</p>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Premise</p>
        <p className="text-xs text-zinc-100">{previewText(entry.data?.premise)}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Stakes</p>
        <p className="text-xs text-zinc-100">{previewText(entry.data?.stakes)}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Complication</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.complications)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">If Ignored</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.ifIgnored)}</p>
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
      navKey="plot-hooks"
      title="Plot Hooks"
      description="Build reusable session starters that can be dropped into any campaign thread."
      flavorLine="A strong hook has urgency, a face, and a consequence for inaction."
      endpoint="/api/worldbuilder/plot-hooks"
      listKey="plotHooks"
      itemKey="plotHook"
      singularLabel="Plot Hook"
      pluralLabel="Plot Hooks"
      fieldGroups={fieldGroups}
      relatedTools={relatedTools}
      presets={presets}
      previewHighlights={previewHighlights}
      tabLabels={{ edit: "Hook Forge", preview: "Session Card" }}
      editHint="Tip: You should be able to run this hook in five minutes using only premise, stakes, and if-ignored."
      renderPreview={renderPreview}
      theme={{
        activeCardClass: "border-pink-400/50 bg-pink-500/10",
        panelClass: "border-pink-300/25",
        sectionClass: "border-pink-400/20",
        badgeClass: "text-pink-200/90",
      }}
    />
  );
}

