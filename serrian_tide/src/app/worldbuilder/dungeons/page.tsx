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
    title: "Dungeon Identity",
    description: "Set purpose and major power influence.",
    fields: [
      { key: "theme", label: "Theme" },
      { key: "entranceHook", label: "Entrance Hook", rows: 4 },
      {
        key: "factions",
        label: "Factions",
        kind: "csv",
        relation: {
          endpoint: "/api/worldbuilder/factions",
          listKey: "factions",
          multi: true,
        },
      },
    ],
  },
  {
    title: "Generation Tables",
    description: "Procedural room and hazard content.",
    fields: [
      {
        key: "roomTable",
        label: "Room Table",
        kind: "table",
        description: "One row per entry: roll | room",
        placeholder: "1-2 | Collapsed atrium with hidden passage",
        tableColumns: ["roll", "room"],
      },
      {
        key: "hazardTable",
        label: "Hazard Table",
        kind: "table",
        description: "One row per entry: roll | hazard",
        placeholder: "1 | Pressure plate dart trap",
        tableColumns: ["roll", "hazard"],
      },
      { key: "lootNotes", label: "Loot Notes", rows: 4 },
    ],
  },
  {
    title: "Living Site Logic",
    description: "How the site responds to player actions over time.",
    fields: [
      {
        key: "livingEvents",
        label: "Living Events",
        kind: "table",
        description: "One row per entry: trigger | event",
        placeholder: "Alarm bell rings | Patrol doubles for 1 hour",
        tableColumns: ["trigger", "event"],
      },
    ],
  },
];

const relatedTools: RelatedToolLink[] = [
  { label: "Factions", href: "/worldbuilder/factions", note: "Define who currently occupies or covets the site." },
  { label: "Plot Hooks", href: "/worldbuilder/plot-hooks", note: "Use hooks as dungeon entry points and mission context." },
  { label: "Settlements", href: "/worldbuilder/settlements", note: "Tie delves to nearby towns and supply lines." },
  { label: "Encounters", href: "/worldbuilder/encounters", note: "Reuse travel and hazard logic before and after the delve." },
];


const presets: ToolPreset[] = [
  {
    label: "Sunken Vault",
    summary: "Flooded ruin with unstable structures and preserved relics.",
    name: "Vault of the Drowned Keep",
    tagline: "Treasure sleeps beneath black water.",
    data: {
      theme: "flooded fortress ruin",
      entranceHook: "A tide recession reveals an old gate for only two nights each month.",
      roomTable: [
        { roll: "1-2", room: "Collapsed archive submerged waist-deep with drifting ledgers." },
        { roll: "3-4", room: "Barracks hall with trapped footlockers and skeletal sentries." },
        { roll: "5-6", room: "Flooded chapel where acoustics trigger hidden mechanisms." },
      ],
      hazardTable: [
        { roll: "1-2", hazard: "Sudden surge current drags characters toward iron grates." },
        { roll: "3-4", hazard: "Waterborne rot inflicts escalating fatigue." },
        { roll: "5-6", hazard: "Ancient pressure doors slam under shifted weight." },
      ],
      lootNotes: "Relics are water-damaged but historically priceless.",
      livingEvents: [
        { trigger: "Fire or loud explosion", event: "Upper chambers crack and increase flood level." },
        { trigger: "Long rest inside", event: "Scavenger crews enter through rear sluice routes." },
      ],
    },
  },
  {
    label: "Clockwork Tomb",
    summary: "Mechanical sepulcher where systems still obey dead architects.",
    name: "The Brass Catacomb",
    tagline: "The dead are punctual here.",
    data: {
      theme: "mechanized funerary complex",
      entranceHook: "A recovered key-gear begins spinning at midnight and points underground.",
      roomTable: [
        { roll: "1-2", room: "Gear gallery with rotating floor segments." },
        { roll: "3-4", room: "Embalming hall repurposed as automaton workshop." },
        { roll: "5-6", room: "Astral timing chamber aligned to seasonal constellations." },
      ],
      hazardTable: [
        { roll: "1-2", hazard: "Spring-loaded blade arrays reset silently." },
        { roll: "3-4", hazard: "Clock chime forces a temporal lockout of exits." },
        { roll: "5-6", hazard: "Steam vents ignite oil residue." },
      ],
      lootNotes: "Precision mechanisms and calibrator stones fetch premium prices.",
      livingEvents: [
        { trigger: "Tampering with central mechanism", event: "Entire complex shifts to lockdown cycle." },
        { trigger: "Recovering royal seal", event: "Dormant guardian line awakens in sequence." },
      ],
    },
  },
  {
    label: "Cult Excavation",
    summary: "Actively occupied dig site with shifting defenses.",
    name: "The Red Pit Labyrinth",
    tagline: "They are still digging when you arrive.",
    data: {
      theme: "active cult excavation",
      entranceHook: "Supply caravans vanish near a recently opened sink crater.",
      roomTable: [
        { roll: "1-2", room: "Rope-bridge trenches over unstable dig shafts." },
        { roll: "3-4", room: "Improvised ritual canteen guarded by initiates." },
        { roll: "5-6", room: "Freshly breached chamber with half-deciphered murals." },
      ],
      hazardTable: [
        { roll: "1-2", hazard: "Shoring collapse buries exits in loose stone." },
        { roll: "3-4", hazard: "Ritual residue causes disorientation and hallucinations." },
        { roll: "5-6", hazard: "Alarm braziers trigger coordinated reinforcements." },
      ],
      lootNotes: "Most valuables are being cataloged for transport off-site.",
      livingEvents: [
        { trigger: "Any combat alarm", event: "Cult leaders seal deeper vault access and relocate relics." },
        { trigger: "Destroying ritual circles", event: "Excavation workers revolt against cult overseers." },
      ],
    },
  },
];

const previewHighlights: PreviewHighlight[] = [
  { label: "Theme", key: "theme" },
  { label: "Entrance Hook", key: "entranceHook" },
  { label: "Room Table", key: "roomTable", kind: "table" },
  { label: "Hazard Table", key: "hazardTable", kind: "table" },
  { label: "Living Events", key: "livingEvents", kind: "table" },
];

export default function DungeonsPage() {
  const renderPreview = (entry: ToolRecord) => (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-slate-200/80">Delve Sheet</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Theme</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.theme)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Entrance Hook</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.entranceHook)}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Room Seeds</p>
          <ul className="mt-1 list-disc pl-4 text-xs text-zinc-100 space-y-1">
            {previewFirstRows(entry.data?.roomTable, ["roll", "room"]).map((line) => (
              <li key={`room-${line}`}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Hazards</p>
          <ul className="mt-1 list-disc pl-4 text-xs text-zinc-100 space-y-1">
            {previewFirstRows(entry.data?.hazardTable, ["roll", "hazard"]).map((line) => (
              <li key={`hz-${line}`}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Living Events</p>
          <ul className="mt-1 list-disc pl-4 text-xs text-zinc-100 space-y-1">
            {previewFirstRows(entry.data?.livingEvents, ["trigger", "event"]).map((line) => (
              <li key={`live-${line}`}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Loot Guidance</p>
        <p className="text-xs text-zinc-100">{previewText(entry.data?.lootNotes)}</p>
      </div>
    </div>
  );

  return (
    <ToolboxCrudBuilder
      navKey="dungeons"
      title="Dungeon / Ruin Builder"
      description="Create reusable site templates with procedural room content and reactive event logic."
      flavorLine="The best dungeons feel alive: they should escalate when players disturb them."
      endpoint="/api/worldbuilder/dungeons"
      listKey="dungeons"
      itemKey="dungeon"
      singularLabel="Dungeon"
      pluralLabel="Dungeons"
      fieldGroups={fieldGroups}
      relatedTools={relatedTools}
      presets={presets}
      previewHighlights={previewHighlights}
      tabLabels={{ edit: "Site Architect", preview: "Delve Sheet" }}
      editHint="Tip: Living events should respond to noise, delay, or player success to keep the site dynamic."
      renderPreview={renderPreview}
      theme={{
        activeCardClass: "border-slate-300/60 bg-slate-400/10",
        panelClass: "border-slate-300/30",
        sectionClass: "border-slate-400/25",
        badgeClass: "text-slate-200/90",
      }}
    />
  );
}

