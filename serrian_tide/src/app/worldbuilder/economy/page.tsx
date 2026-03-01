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
    title: "Currency & Labor",
    description: "Baseline money assumptions for the region.",
    fields: [
      { key: "currencies", label: "Currencies", rows: 4 },
      { key: "wages", label: "Wages", rows: 4 },
      { key: "priceNotes", label: "Price Notes", rows: 4 },
    ],
  },
  {
    title: "Trade Conditions",
    description: "What moves, what is scarce, and what is illegal.",
    fields: [
      { key: "tradeGoods", label: "Trade Goods", rows: 4 },
      { key: "scarcity", label: "Scarcity", rows: 4 },
      { key: "blackMarket", label: "Black Market", rows: 4 },
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
    ],
  },
];

const relatedTools: RelatedToolLink[] = [
  { label: "Geography", href: "/worldbuilder/geography", note: "Link trade patterns to terrain and travel routes." },
  { label: "Settlements", href: "/worldbuilder/settlements", note: "Different settlements can share or diverge from this model." },
  { label: "Factions", href: "/worldbuilder/factions", note: "Capture guild monopolies, tariffs, and smuggling control." },
  { label: "Inventory", href: "/worldbuilder/inventory", note: "Use item libraries as concrete examples of price behavior." },
];


const presets: ToolPreset[] = [
  {
    label: "War Economy",
    summary: "Militarized production with severe civilian shortages.",
    name: "Levy-State Market",
    tagline: "If it cannot feed armies, it is taxed out.",
    data: {
      currencies: "Iron Mark (state), quarter-scrip (garrison), barter in border zones.",
      wages: "Soldiers paid in steady scrip; civilians paid irregularly.",
      priceNotes: "Metal, mounts, and medicine inflated 2x-4x.",
      tradeGoods: "Grain convoys, iron billets, saddle leather, lamp oil.",
      scarcity: "Timber, alchemical reagents, field surgeons.",
      blackMarket: "Forged requisition seals and stolen quartermaster lots.",
    },
  },
  {
    label: "Port Mercantile",
    summary: "High-liquidity trade city with volatile shipping rates.",
    name: "Free Harbor Ledger",
    tagline: "Everything is available, nothing is stable.",
    data: {
      currencies: "Harbor crowns, foreign coin accepted at changing daily ratios.",
      wages: "Dock labor spikes with ship arrivals; scribes paid premium.",
      priceNotes: "Import luxuries cheap in season, impossible in storm months.",
      tradeGoods: "Spices, dyed cloth, navigational charts, preserved fish.",
      scarcity: "Fresh water during dry season and quality ship timber.",
      blackMarket: "Manifest laundering and bonded warehouse diversions.",
    },
  },
  {
    label: "Famine Recovery",
    summary: "Post-crisis ration system with strict enforcement.",
    name: "Ration-Lantern Districts",
    tagline: "Bread is policy now.",
    data: {
      currencies: "Relief chits and grain tokens alongside old coin.",
      wages: "Public works wages tied to ration multipliers.",
      priceNotes: "Staples fixed by decree; luxury goods effectively inaccessible.",
      tradeGoods: "Salt grain, dried legumes, medicinal tea, repair tools.",
      scarcity: "Meat, sugar, cloth dye, brewing grain.",
      blackMarket: "Counterfeit ration seals and convoy diversion rings.",
    },
  },
];

const previewHighlights: PreviewHighlight[] = [
  { label: "Currencies", key: "currencies" },
  { label: "Wages", key: "wages" },
  { label: "Trade Goods", key: "tradeGoods" },
  { label: "Scarcity", key: "scarcity" },
  { label: "Black Market", key: "blackMarket" },
];

export default function EconomyPage() {
  const renderPreview = (entry: ToolRecord) => (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-lime-200/80">Market Brief</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Currencies</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.currencies)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Wages</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.wages)}</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/35 p-2">
        <p className="text-[11px] text-zinc-400">Trade Goods</p>
        <p className="text-xs text-zinc-100">{previewText(entry.data?.tradeGoods)}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Scarcity Signal</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.scarcity)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/35 p-2">
          <p className="text-[11px] text-zinc-400">Black Market</p>
          <p className="text-xs text-zinc-100">{previewText(entry.data?.blackMarket)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <ToolboxCrudBuilder
      navKey="economy"
      title="Economy & Trade"
      description="Define reusable economic conditions that affect scarcity, pricing, and social pressure."
      flavorLine="Economy entries should answer one table question quickly: what is hard to get right now?"
      endpoint="/api/worldbuilder/economy"
      listKey="economy"
      itemKey="economyEntry"
      singularLabel="Economy Entry"
      pluralLabel="Economy Entries"
      fieldGroups={fieldGroups}
      relatedTools={relatedTools}
      presets={presets}
      previewHighlights={previewHighlights}
      tabLabels={{ edit: "Trade Desk", preview: "Market Brief" }}
      editHint="Tip: Write this like a GM-facing economy snapshot: what changed, what got expensive, who profits."
      renderPreview={renderPreview}
      theme={{
        activeCardClass: "border-lime-400/50 bg-lime-500/10",
        panelClass: "border-lime-300/25",
        sectionClass: "border-lime-400/20",
        badgeClass: "text-lime-200/90",
      }}
    />
  );
}

