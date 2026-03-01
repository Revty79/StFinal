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
    title: "Chronology",
    description: "When and where this event sits in the world timeline.",
    fields: [
      { key: "era", label: "Era" },
      { key: "dateLabel", label: "Date Label", placeholder: "Year 312, Frostwane 3..." },
      { key: "event", label: "Event", rows: 4 },
    ],
  },
  {
    title: "Interpretation",
    description: "The official account vs what is whispered.",
    fields: [
      { key: "consequences", label: "Consequences", rows: 4 },
      { key: "rumorVersion", label: "Rumor Version", rows: 4 },
    ],
  },
  {
    title: "Cross-Links",
    description: "Attach factions, places, and NPCs tied to the event.",
    fields: [
      {
        key: "relatedFactionIds",
        label: "Related Factions",
        kind: "csv",
        relation: {
          endpoint: "/api/worldbuilder/factions",
          listKey: "factions",
          multi: true,
        },
      },
      {
        key: "relatedGeographyIds",
        label: "Related Geography",
        kind: "csv",
        relation: {
          endpoint: "/api/worldbuilder/geography",
          listKey: "geography",
          multi: true,
        },
      },
      {
        key: "relatedNpcIds",
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
];

const relatedTools: RelatedToolLink[] = [
  { label: "Factions", href: "/worldbuilder/factions", note: "Record wars, alliances, schisms, and successions." },
  { label: "Geography", href: "/worldbuilder/geography", note: "Track migrations, border shifts, and disasters." },
  { label: "NPCs", href: "/worldbuilder/npcs", note: "Index historical figures and current inheritors." },
  { label: "Plot Hooks", href: "/worldbuilder/plot-hooks", note: "Convert old events into present-day adventure seeds." },
];


const presets: ToolPreset[] = [
  {
    label: "Dynastic Collapse",
    summary: "Succession crisis that fractures central authority.",
    name: "The Third Sundering",
    tagline: "A throne breaks faster than a kingdom.",
    data: {
      era: "Late Imperial",
      dateLabel: "Year 412, Emberwane 19",
      event: "The ruling line fractured into rival claimants after an assassination at court.",
      consequences: "Regional governors became semi-independent and raised private armies.",
      rumorVersion: "Some claim the death was staged to trigger emergency powers.",
    },
  },
  {
    label: "Cataclysm Event",
    summary: "Natural or arcane disaster that permanently changed geography.",
    name: "The Black Tide Year",
    tagline: "No map survived unchanged.",
    data: {
      era: "Age of Upheaval",
      dateLabel: "Year 233, Nightfall Month",
      event: "A chain of tidal surges consumed old ports and opened inland salt basins.",
      consequences: "Trade lanes moved north; coastal capitals lost dominance.",
      rumorVersion: "Witnesses insist the sea withdrew first as if commanded.",
    },
  },
  {
    label: "Holy Schism",
    summary: "Doctrinal split reshapes institutions and law.",
    name: "The Broken Creed",
    tagline: "Faith became policy by force.",
    data: {
      era: "Age of Concord",
      dateLabel: "Year 301, Dawnfeast 2",
      event: "Temple councils split over succession rites and declared mutual heresy.",
      consequences: "Parallel legal systems emerged across rival jurisdictions.",
      rumorVersion: "A sealed relic prophecy was suppressed before the vote.",
    },
  },
];

const previewHighlights: PreviewHighlight[] = [
  { label: "Era", key: "era" },
  { label: "Date", key: "dateLabel" },
  { label: "Event", key: "event" },
  { label: "Consequences", key: "consequences" },
  { label: "Rumor Version", key: "rumorVersion" },
];

export default function TimelinePage() {
  const renderPreview = (entry: ToolRecord) => (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-cyan-200/80">Chronicle Entry</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Era</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.era)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Date Label</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.dateLabel)}</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Recorded Event</p>
        <p className="text-xs text-zinc-100">{previewText(entry.data?.event)}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Consequences</p>
        <p className="text-xs text-zinc-100">{previewText(entry.data?.consequences)}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Rumor Version</p>
        <p className="text-xs text-zinc-100">{previewText(entry.data?.rumorVersion)}</p>
      </div>
    </div>
  );

  return (
    <ToolboxCrudBuilder
      navKey="timeline"
      title="History & Timeline"
      description="Capture the events that define eras, shape politics, and fuel new stories."
      flavorLine="Write each event so it can be read as both fact and rumor at the table."
      endpoint="/api/worldbuilder/timeline"
      listKey="timeline"
      itemKey="timelineEntry"
      singularLabel="Timeline Entry"
      pluralLabel="Timeline Entries"
      fieldGroups={fieldGroups}
      relatedTools={relatedTools}
      presets={presets}
      previewHighlights={previewHighlights}
      tabLabels={{ edit: "Archivist", preview: "Chronicle" }}
      editHint="Tip: Chronicle entries should provide both canonical history and table-usable uncertainty."
      renderPreview={renderPreview}
      theme={{
        activeCardClass: "border-cyan-400/50 bg-cyan-500/10",
        panelClass: "border-cyan-300/25",
        sectionClass: "border-cyan-400/20",
        badgeClass: "text-cyan-200/90",
      }}
    />
  );
}

