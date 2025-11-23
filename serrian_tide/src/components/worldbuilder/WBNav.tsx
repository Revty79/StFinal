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
  | "plot-hooks";

interface NavItem {
  href: string;
  key: WBNavKey;
  label: string;
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/worldbuilder/creatures", key: "creatures", label: "Creatures" },
  { href: "/worldbuilder/skillsets", key: "skillsets", label: "Skillsets" },
  { href: "/worldbuilder/races", key: "races", label: "Races" },
  { href: "/worldbuilder/inventory", key: "inventory", label: "Inventory" },
  { href: "/worldbuilder/calendars", key: "calendars", label: "Calendars" },
  { href: "/worldbuilder/npcs", key: "npcs", label: "NPCs" },
  { href: "/worldbuilder/coming-soon", key: "factions", label: "Factions", comingSoon: true },
  { href: "/worldbuilder/coming-soon", key: "geography", label: "Geography & Regions", comingSoon: true },
  { href: "/worldbuilder/coming-soon", key: "plot-hooks", label: "Plot Hooks", comingSoon: true },
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
            {it.comingSoon && (
              <span className="ml-1.5 text-[10px] opacity-60">(soon)</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
