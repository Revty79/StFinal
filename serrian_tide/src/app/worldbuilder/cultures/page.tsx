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
    title: "Identity",
    description: "How this culture names, presents, and narrates itself.",
    fields: [
      { key: "namingRules", label: "Naming Rules", rows: 4 },
      { key: "aesthetics", label: "Aesthetics", rows: 4 },
      { key: "commonPhrases", label: "Common Phrases", rows: 4 },
    ],
  },
  {
    title: "Norms & Structure",
    description: "Default assumptions and social ordering.",
    fields: [
      { key: "values", label: "Values", rows: 4 },
      { key: "taboos", label: "Taboos", rows: 4 },
      { key: "socialStructure", label: "Social Structure", rows: 4 },
      { key: "languageNotes", label: "Language Notes", rows: 4 },
    ],
  },
  {
    title: "Territorial & Political Links",
    description: "Where this culture lives and what powers shape it.",
    fields: [
      {
        key: "regions",
        label: "Regions",
        kind: "csv",
        relation: {
          endpoint: "/api/worldbuilder/geography",
          listKey: "geography",
          multi: true,
        },
      },
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
];

const relatedTools: RelatedToolLink[] = [
  { label: "Geography", href: "/worldbuilder/geography", note: "Anchor cultures to specific lands and frontiers." },
  { label: "Factions", href: "/worldbuilder/factions", note: "Model how institutions enforce or resist cultural norms." },
  { label: "Pantheon", href: "/worldbuilder/pantheon", note: "Tie rituals, taboos, and values to belief systems." },
  { label: "Settlements", href: "/worldbuilder/settlements", note: "Show variations between urban and rural expressions." },
];


const presets: ToolPreset[] = [
  {
    label: "Mariner Confederacy",
    summary: "Port-connected culture built on oath contracts and weather literacy.",
    name: "Wavebound Houses",
    tagline: "A promise survives only if witnessed.",
    data: {
      namingRules: "Given name + tide-name + house mark. Titles earned by voyages.",
      values: "Contract honor, practical generosity, navigation mastery.",
      taboos: "Breaking harbor sanctuary or refusing shipwreck aid.",
      aesthetics: "Weathered blues, knotwork tattoos, brass tide-charms.",
      socialStructure: "House captains elect rotating harbor stewards.",
      languageNotes: "Heavy use of current metaphors and directional honorifics.",
      commonPhrases: "\"Tie the knot before the storm.\"",
    },
  },
  {
    label: "Mountain Clans",
    summary: "Kin-based highland society centered on memory and feud law.",
    name: "The Stonekin Marches",
    tagline: "Names are inherited responsibilities.",
    data: {
      namingRules: "Child name at birth, adult name at first oath, elder-name by consensus.",
      values: "Ancestral continuity, oath reciprocity, endurance.",
      taboos: "Speaking a dead rival's name without witness rite.",
      aesthetics: "Layered wool, carved bone tokens, clan pigment braids.",
      socialStructure: "Moot councils with clan matrons and war-captains.",
      languageNotes: "Formal speech distinguishes seven kinship distances.",
      commonPhrases: "\"Carry the weight, earn the stone.\"",
    },
  },
  {
    label: "Courtly Bureaucracy",
    summary: "Urban literate culture where status flows through records and ritual.",
    name: "Velorian Ledger Courts",
    tagline: "Ink decides before steel does.",
    data: {
      namingRules: "Family name first, office-name second, courtesy title last.",
      values: "Precision, precedent, social composure.",
      taboos: "Public contradiction of formally sealed testimony.",
      aesthetics: "Layered formal robes, sigil pins, lacquered script tablets.",
      socialStructure: "Exam-ranked civil tiers with patron-client ladders.",
      languageNotes: "Politeness levels encode legal and social standing.",
      commonPhrases: "\"Let the archive speak.\"",
    },
  },
];

const previewHighlights: PreviewHighlight[] = [
  { label: "Naming Rules", key: "namingRules" },
  { label: "Core Values", key: "values" },
  { label: "Primary Taboos", key: "taboos" },
  { label: "Social Structure", key: "socialStructure" },
  { label: "Common Phrases", key: "commonPhrases" },
];

export default function CulturesPage() {
  const renderPreview = (entry: ToolRecord) => (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-teal-200/80">Culture Play Notes</p>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Naming Rules</p>
        <p className="text-xs text-zinc-100">{previewText(entry.data?.namingRules)}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Values</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.values)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Taboos</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.taboos)}</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Social Structure</p>
        <p className="text-xs text-zinc-100">{previewText(entry.data?.socialStructure)}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Common Phrase</p>
        <p className="text-xs text-zinc-100">{previewText(entry.data?.commonPhrases)}</p>
      </div>
    </div>
  );

  return (
    <ToolboxCrudBuilder
      navKey="cultures"
      title="Culture & Languages"
      description="Create cultural templates that guide dialogue, values, and social friction."
      flavorLine="Culture entries are strongest when they describe behavior, not just aesthetics."
      endpoint="/api/worldbuilder/cultures"
      listKey="cultures"
      itemKey="culture"
      singularLabel="Culture"
      pluralLabel="Cultures"
      fieldGroups={fieldGroups}
      relatedTools={relatedTools}
      presets={presets}
      previewHighlights={previewHighlights}
      tabLabels={{ edit: "Anthropology Desk", preview: "Play Notes" }}
      editHint="Tip: Fill this as if an NPC from this culture must improvise dialogue and priorities tonight."
      renderPreview={renderPreview}
      theme={{
        activeCardClass: "border-teal-400/50 bg-teal-500/10",
        panelClass: "border-teal-300/25",
        sectionClass: "border-teal-400/20",
        badgeClass: "text-teal-200/90",
      }}
    />
  );
}

