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
    title: "Divine Profile",
    description: "Who or what is worshipped.",
    fields: [
      { key: "deityType", label: "Deity Type", placeholder: "god, saint, ancestor, spirit..." },
      { key: "domains", label: "Domains", kind: "csv", placeholder: "war, sea, fate..." },
      { key: "relics", label: "Relics", rows: 4 },
    ],
  },
  {
    title: "Doctrine",
    description: "Beliefs that actually shape behavior.",
    fields: [
      { key: "tenets", label: "Tenets", rows: 4 },
      { key: "taboos", label: "Taboos", rows: 4 },
      { key: "rites", label: "Rites", rows: 4 },
      { key: "holyDays", label: "Holy Days", rows: 3 },
    ],
  },
  {
    title: "Institutional Links",
    description: "Factions or groups that carry this faith.",
    fields: [
      {
        key: "factions",
        label: "Associated Factions",
        kind: "csv",
        relation: {
          endpoint: "/api/worldbuilder/factions",
          listKey: "factions",
          multi: true,
        },
      },
    ],
  },
];

const relatedTools: RelatedToolLink[] = [
  { label: "Cultures", href: "/worldbuilder/cultures", note: "Align values, taboos, and naming with belief systems." },
  { label: "Factions", href: "/worldbuilder/factions", note: "Track churches, sects, inquisitions, and cults." },
  { label: "Timeline", href: "/worldbuilder/timeline", note: "Record schisms, revelations, and holy wars." },
  { label: "Settlements", href: "/worldbuilder/settlements", note: "Link temples, pilgrimage cities, and sacred ruins." },
];


const presets: ToolPreset[] = [
  {
    label: "Storm God Cult",
    summary: "Sea-and-sky deity worshipped by sailors and raiders.",
    name: "Vaelor, Lord of the Broken Sky",
    tagline: "Thunder is judgment made audible.",
    data: {
      deityType: "god",
      domains: ["storm", "war", "voyage"],
      tenets: "Courage before chaos; repay blood-debts; honor sworn crews.",
      taboos: "Never abandon a shipmate to drowning.",
      rites: "Salt libations before departure and oath knots before battle.",
      holyDays: "Tempestwake (first storm of spring)",
      relics: "The Chain of Nine Bells",
    },
  },
  {
    label: "Ancestor Veneration",
    summary: "Lineage-based spiritual system tied to household law.",
    name: "Hearthline Ancestors",
    tagline: "The dead adjudicate the living.",
    data: {
      deityType: "ancestor",
      domains: ["lineage", "memory", "oath"],
      tenets: "Preserve genealogies; honor elder testimony; maintain household shrines.",
      taboos: "Destroying family records is sacrilege.",
      rites: "Seasonal meal offerings and threshold lamp ceremonies.",
      holyDays: "Namesday of Ashes",
      relics: "Genealogical tablets and bloodseal rings",
    },
  },
  {
    label: "Mercy Saint Order",
    summary: "Healing faith with strict vows and political leverage.",
    name: "Saint Ilyra of the Last Lantern",
    tagline: "No wound is beneath witness.",
    data: {
      deityType: "saint",
      domains: ["healing", "charity", "atonement"],
      tenets: "Treat first, judge later; keep sanctuary neutral; record all confessions.",
      taboos: "Denying care for political reasons.",
      rites: "Night vigils, oath-bands, and absolution rites.",
      holyDays: "Lanternfast",
      relics: "The Bronze Veil and tear-ink codices",
    },
  },
];

const previewHighlights: PreviewHighlight[] = [
  { label: "Deity Type", key: "deityType" },
  { label: "Domains", key: "domains", kind: "csv" },
  { label: "Core Tenets", key: "tenets" },
  { label: "Major Taboos", key: "taboos" },
  { label: "Holy Days", key: "holyDays" },
];

export default function PantheonPage() {
  const renderPreview = (entry: ToolRecord) => (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-yellow-200/80">Doctrine Sheet</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Deity Type</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.deityType)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Domains</p>
          <p className="text-xs text-zinc-100">{previewCsv(entry.data?.domains)}</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Tenets</p>
        <p className="text-xs text-zinc-100">{previewText(entry.data?.tenets)}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Taboos</p>
        <p className="text-xs text-zinc-100">{previewText(entry.data?.taboos)}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Rites</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.rites)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Holy Days</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.holyDays)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <ToolboxCrudBuilder
      navKey="pantheon"
      title="Pantheon / Deities / Religions"
      description="Build spiritual systems that influence law, conflict, rituals, and identity."
      flavorLine="Make faith entries playable: give followers obligations, benefits, and fault lines."
      endpoint="/api/worldbuilder/pantheon"
      listKey="pantheon"
      itemKey="deity"
      singularLabel="Deity Entry"
      pluralLabel="Deity Entries"
      fieldGroups={fieldGroups}
      relatedTools={relatedTools}
      presets={presets}
      previewHighlights={previewHighlights}
      tabLabels={{ edit: "Theology Desk", preview: "Doctrine" }}
      editHint="Tip: Tie doctrine to behavior. Tenets and taboos should change how followers act in scenes."
      renderPreview={renderPreview}
      theme={{
        activeCardClass: "border-yellow-400/50 bg-yellow-500/10",
        panelClass: "border-yellow-300/25",
        sectionClass: "border-yellow-400/20",
        badgeClass: "text-yellow-200/90",
      }}
    />
  );
}

