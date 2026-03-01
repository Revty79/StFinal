import Link from "next/link";

export type WBNavKey =
  | "creatures"
  | "skillsets"
  | "races"
  | "inventory"
  | "calendars"
  | "npcs"
  | "factions"
  | "geography"
  | "plot-hooks"
  | "timeline"
  | "settlements"
  | "pantheon"
  | "cultures"
  | "economy"
  | "encounters"
  | "dungeons";

interface NavItem {
  href: string;
  key: WBNavKey;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/worldbuilder/creatures", key: "creatures", label: "Creatures" },
  { href: "/worldbuilder/skillsets", key: "skillsets", label: "Skillsets" },
  { href: "/worldbuilder/races", key: "races", label: "Races" },
  { href: "/worldbuilder/inventory", key: "inventory", label: "Inventory" },
  { href: "/worldbuilder/calendars", key: "calendars", label: "Calendars" },
  { href: "/worldbuilder/npcs", key: "npcs", label: "NPCs" },
  { href: "/worldbuilder/factions", key: "factions", label: "Factions" },
  { href: "/worldbuilder/geography", key: "geography", label: "Geography & Regions" },
  { href: "/worldbuilder/plot-hooks", key: "plot-hooks", label: "Plot Hooks" },
  { href: "/worldbuilder/timeline", key: "timeline", label: "Timeline" },
  { href: "/worldbuilder/settlements", key: "settlements", label: "Settlements" },
  { href: "/worldbuilder/pantheon", key: "pantheon", label: "Pantheon" },
  { href: "/worldbuilder/cultures", key: "cultures", label: "Cultures" },
  { href: "/worldbuilder/economy", key: "economy", label: "Economy" },
  { href: "/worldbuilder/encounters", key: "encounters", label: "Encounters" },
  { href: "/worldbuilder/dungeons", key: "dungeons", label: "Dungeons" },
];

export function WBNav({ current }: { current?: WBNavKey }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {NAV_ITEMS.map((it) => {
        const active = current === it.key;
        return (
          <Link
            key={it.key}
            href={it.href}
            className={[
              "rounded-xl px-3 py-1.5 text-sm border transition",
              active
                ? "border-violet-400/40 text-violet-200 bg-violet-400/10"
                : "border-white/15 text-zinc-200 hover:bg-white/10",
            ].join(" ")}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
