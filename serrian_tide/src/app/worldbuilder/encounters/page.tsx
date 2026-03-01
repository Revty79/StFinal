"use client";

import {
  ToolboxCrudBuilder,
  type PreviewHighlight,
  type ToolFieldGroup,
  type ToolPreset,
  type RelatedToolLink,
  type ToolRecord,
} from "@/components/worldbuilder/ToolboxCrudBuilder";
import { previewFirstRows, previewText } from "@/lib/worldbuilderPreview";

const fieldGroups: ToolFieldGroup[] = [
  {
    title: "Travel Context",
    description: "Set assumptions before rolling any table.",
    fields: [
      { key: "biome", label: "Biome" },
      { key: "weatherNotes", label: "Weather Notes", rows: 4 },
      { key: "travelPace", label: "Travel Pace", rows: 3 },
    ],
  },
  {
    title: "Encounter Procedures",
    description: "Procedural tables for active travel gameplay.",
    fields: [
      {
        key: "encounterTable",
        label: "Encounter Table",
        kind: "table",
        description: "One row per entry: roll | result",
        placeholder: "1-2 | Ambushed by scouts",
        tableColumns: ["roll", "result"],
      },
      {
        key: "hazardTable",
        label: "Hazard Table",
        kind: "table",
        description: "One row per entry: roll | result",
        placeholder: "1 | Sudden sinkhole",
        tableColumns: ["roll", "result"],
      },
      {
        key: "restEvents",
        label: "Rest Events",
        kind: "table",
        description: "One row per entry: roll | result",
        placeholder: "1-3 | Quiet night, no interruption",
        tableColumns: ["roll", "result"],
      },
    ],
  },
];

const relatedTools: RelatedToolLink[] = [
  { label: "Geography", href: "/worldbuilder/geography", note: "Build one encounter set per region or biome." },
  { label: "Creatures", href: "/worldbuilder/creatures", note: "Use creature entries as table results or variants." },
  { label: "Factions", href: "/worldbuilder/factions", note: "Add patrols, spies, and faction pressure to roads." },
  { label: "Dungeons", href: "/worldbuilder/dungeons", note: "Chain travel outcomes into site-based delves." },
];


const presets: ToolPreset[] = [
  {
    label: "Bandit Road",
    summary: "Lawless trade corridor with frequent faction interference.",
    name: "Red Mile Patrol Matrix",
    tagline: "Coin moves faster than justice.",
    data: {
      biome: "dry highroad corridor",
      weatherNotes: "Hot daytime wind, cold night exposure, frequent dust shears.",
      travelPace: "Fast travel possible on road, risky off-road shortcuts.",
      encounterTable: [
        { roll: "1-2", result: "Bandit scouts demand road tolls under a false warrant." },
        { roll: "3-4", result: "Merchant convoy asks armed escort after sabotage." },
        { roll: "5", result: "Faction patrol searches wagons for contraband ledgers." },
        { roll: "6", result: "A decoy distress signal lures travelers into an ambush site." },
      ],
      hazardTable: [
        { roll: "1", result: "Bridge planks fail under heavy load." },
        { roll: "2", result: "Dust storm cuts visibility to near zero." },
        { roll: "3", result: "Water cache found poisoned or tainted." },
      ],
      restEvents: [
        { roll: "1-2", result: "Quiet camp, recover fully." },
        { roll: "3-4", result: "Night theft attempt targets pack animals." },
        { roll: "5-6", result: "Messenger arrives with urgent bounty notice." },
      ],
    },
  },
  {
    label: "Haunted Marsh",
    summary: "Fogbound wetlands with disorientation and memory effects.",
    name: "Mirewatch Event Deck",
    tagline: "The swamp hears names spoken aloud.",
    data: {
      biome: "marshland",
      weatherNotes: "Dense dawn fog, stagnant heat, sudden chill pockets.",
      travelPace: "Slow; navigation checks required at each major fork.",
      encounterTable: [
        { roll: "1-2", result: "Lost pilgrims mistake party for shrine wardens." },
        { roll: "3-4", result: "Corpse-lights lure travelers toward sinking ground." },
        { roll: "5-6", result: "Territorial predator circles but tests from distance." },
      ],
      hazardTable: [
        { roll: "1-2", result: "Bog collapse swallows gear and mounts." },
        { roll: "3-4", result: "Leech swarm causes fatigue and infection risk." },
        { roll: "5-6", result: "Phantom echoes impose false navigation cues." },
      ],
      restEvents: [
        { roll: "1-3", result: "Uneasy rest with distant chanting in fog." },
        { roll: "4-5", result: "A local guide offers safe passage for a favor." },
        { roll: "6", result: "Camp appears moved at dawn without footprints." },
      ],
    },
  },
  {
    label: "Winter Pass",
    summary: "High-altitude route where weather is the primary enemy.",
    name: "Frostspine Transit Table",
    tagline: "Every mile is negotiated with the mountain.",
    data: {
      biome: "alpine pass",
      weatherNotes: "Whiteout risk, ice crust, avalanches after midday thaw.",
      travelPace: "Slow and cautious with mandatory shelter windows.",
      encounterTable: [
        { roll: "1-2", result: "Stranded caravan requests rope teams and heatstones." },
        { roll: "3-4", result: "Predator pack shadows camp perimeter at dusk." },
        { roll: "5-6", result: "Border skirmish survivors seek escort through pass." },
      ],
      hazardTable: [
        { roll: "1-2", result: "Avalanche trigger from unstable overhang." },
        { roll: "3-4", result: "Black ice causes critical footing failure." },
        { roll: "5-6", result: "Frostbite onset from exposed travel segment." },
      ],
      restEvents: [
        { roll: "1-2", result: "Shelter holds; additional warmth recovered." },
        { roll: "3-4", result: "Night wind tears tents and extinguishes fires." },
        { roll: "5-6", result: "Distant signal flare marks unknown distress." },
      ],
    },
  },
];

const previewHighlights: PreviewHighlight[] = [
  { label: "Biome", key: "biome" },
  { label: "Weather Notes", key: "weatherNotes" },
  { label: "Travel Pace", key: "travelPace" },
  { label: "Encounter Table", key: "encounterTable", kind: "table" },
  { label: "Hazard Table", key: "hazardTable", kind: "table" },
];

export default function EncountersPage() {
  const renderPreview = (entry: ToolRecord) => (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-rose-200/80">Travel Procedure Sheet</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Biome</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.biome)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Travel Pace</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.travelPace)}</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Weather Pressure</p>
        <p className="text-xs text-zinc-100">{previewText(entry.data?.weatherNotes)}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Encounter Results</p>
          <ul className="mt-1 list-disc pl-4 text-xs text-zinc-100 space-y-1">
            {previewFirstRows(entry.data?.encounterTable, ["roll", "result"]).map((line) => (
              <li key={`e-${line}`}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Hazard Results</p>
          <ul className="mt-1 list-disc pl-4 text-xs text-zinc-100 space-y-1">
            {previewFirstRows(entry.data?.hazardTable, ["roll", "result"]).map((line) => (
              <li key={`h-${line}`}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Rest Events</p>
          <ul className="mt-1 list-disc pl-4 text-xs text-zinc-100 space-y-1">
            {previewFirstRows(entry.data?.restEvents, ["roll", "result"]).map((line) => (
              <li key={`r-${line}`}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <ToolboxCrudBuilder
      navKey="encounters"
      title="Encounter & Travel Engine"
      description="Create plug-and-play encounter procedures for overland movement and dangerous travel."
      flavorLine="Keep results short and actionable so each roll becomes immediate table momentum."
      endpoint="/api/worldbuilder/encounters"
      listKey="encounters"
      itemKey="encounter"
      singularLabel="Encounter Set"
      pluralLabel="Encounter Sets"
      fieldGroups={fieldGroups}
      relatedTools={relatedTools}
      presets={presets}
      previewHighlights={previewHighlights}
      tabLabels={{ edit: "Procedure Builder", preview: "Run Sheet" }}
      editHint="Tip: A table is good when every result changes what the party does next turn."
      renderPreview={renderPreview}
      theme={{
        activeCardClass: "border-rose-400/50 bg-rose-500/10",
        panelClass: "border-rose-300/25",
        sectionClass: "border-rose-400/20",
        badgeClass: "text-rose-200/90",
      }}
    />
  );
}

