import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/session";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { GradientText } from "@/components/GradientText";

type ToolCard = {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  iconBg: string;
  dotBg: string;
  hoverShadow: string;
};

const TOOL_CARDS: ToolCard[] = [
  {
    title: "Races",
    description: "Create peoples, lineages, and strange bloodlines that will live in your worlds.",
    href: "/worldbuilder/races",
    buttonLabel: "Enter Races",
    iconBg: "bg-emerald-500/20",
    dotBg: "bg-emerald-300",
    hoverShadow: "hover:shadow-[0_0_40px_rgba(52,211,153,0.15)]",
  },
  {
    title: "Skillsets",
    description:
      "Define skills, spell lists, disciplines, and other engines that power characters and creatures.",
    href: "/worldbuilder/skillsets",
    buttonLabel: "Enter Skillsets",
    iconBg: "bg-blue-500/20",
    dotBg: "bg-blue-300",
    hoverShadow: "hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]",
  },
  {
    title: "Creatures",
    description:
      "Build monsters, beasts, mounts, pets, and companions that inhabit your worlds and test your tables.",
    href: "/worldbuilder/creatures",
    buttonLabel: "Enter Creatures",
    iconBg: "bg-rose-500/20",
    dotBg: "bg-rose-300",
    hoverShadow: "hover:shadow-[0_0_40px_rgba(248,113,113,0.15)]",
  },
  {
    title: "Inventory",
    description:
      "Manage weapons, gear, artifacts, services, and other tangible stuff that flows through your worlds.",
    href: "/worldbuilder/inventory",
    buttonLabel: "Enter Inventory",
    iconBg: "bg-amber-500/20",
    dotBg: "bg-amber-300",
    hoverShadow: "hover:shadow-[0_0_40px_rgba(251,191,36,0.15)]",
  },
  {
    title: "NPCs",
    description: "Create NPCs with personality and story hooks for your worlds and campaigns.",
    href: "/worldbuilder/npcs",
    buttonLabel: "Enter NPCs",
    iconBg: "bg-purple-500/20",
    dotBg: "bg-purple-300",
    hoverShadow: "hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]",
  },
  {
    title: "Calendars",
    description: "Design custom calendars with unique days, months, and celestial cycles.",
    href: "/worldbuilder/calendars",
    buttonLabel: "Enter Calendars",
    iconBg: "bg-violet-500/20",
    dotBg: "bg-violet-300",
    hoverShadow: "hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]",
  },
  {
    title: "Factions",
    description: "Build organizations, guilds, and political powers with goals and relationships.",
    href: "/worldbuilder/factions",
    buttonLabel: "Enter Factions",
    iconBg: "bg-indigo-500/20",
    dotBg: "bg-indigo-300",
    hoverShadow: "hover:shadow-[0_0_40px_rgba(99,102,241,0.15)]",
  },
  {
    title: "Geography & Regions Builder",
    description:
      "Shape continents, regions, and locations to define the physical canvas of your worlds.",
    href: "/worldbuilder/geography",
    buttonLabel: "Enter Geography",
    iconBg: "bg-green-500/20",
    dotBg: "bg-green-300",
    hoverShadow: "hover:shadow-[0_0_40px_rgba(34,197,94,0.15)]",
  },
  {
    title: "Plot Hooks",
    description: "Craft reusable story seeds, rumors, and quests to drive your campaigns and sessions.",
    href: "/worldbuilder/plot-hooks",
    buttonLabel: "Enter Plot Hooks",
    iconBg: "bg-pink-500/20",
    dotBg: "bg-pink-300",
    hoverShadow: "hover:shadow-[0_0_40px_rgba(236,72,153,0.15)]",
  },
  {
    title: "History & Timeline",
    description: "Capture eras, events, and consequences in a reusable world history library.",
    href: "/worldbuilder/timeline",
    buttonLabel: "Enter Timeline",
    iconBg: "bg-cyan-500/20",
    dotBg: "bg-cyan-300",
    hoverShadow: "hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]",
  },
  {
    title: "Settlements & POIs",
    description: "Build cities, villages, forts, temples, and notable points of interest.",
    href: "/worldbuilder/settlements",
    buttonLabel: "Enter Settlements",
    iconBg: "bg-orange-500/20",
    dotBg: "bg-orange-300",
    hoverShadow: "hover:shadow-[0_0_40px_rgba(249,115,22,0.15)]",
  },
  {
    title: "Pantheon / Religions",
    description: "Create deities, cults, rites, and taboos that shape world belief systems.",
    href: "/worldbuilder/pantheon",
    buttonLabel: "Enter Pantheon",
    iconBg: "bg-yellow-500/20",
    dotBg: "bg-yellow-300",
    hoverShadow: "hover:shadow-[0_0_40px_rgba(234,179,8,0.15)]",
  },
  {
    title: "Culture & Languages",
    description: "Define naming rules, values, social structures, and language notes by culture.",
    href: "/worldbuilder/cultures",
    buttonLabel: "Enter Cultures",
    iconBg: "bg-teal-500/20",
    dotBg: "bg-teal-300",
    hoverShadow: "hover:shadow-[0_0_40px_rgba(20,184,166,0.15)]",
  },
  {
    title: "Economy & Trade",
    description: "Track currencies, scarcity, wages, and regional trade conditions.",
    href: "/worldbuilder/economy",
    buttonLabel: "Enter Economy",
    iconBg: "bg-lime-500/20",
    dotBg: "bg-lime-300",
    hoverShadow: "hover:shadow-[0_0_40px_rgba(132,204,22,0.15)]",
  },
  {
    title: "Encounter & Travel Engine",
    description: "Build encounter, hazard, and travel-event tables for fast session prep.",
    href: "/worldbuilder/encounters",
    buttonLabel: "Enter Encounters",
    iconBg: "bg-red-500/20",
    dotBg: "bg-red-300",
    hoverShadow: "hover:shadow-[0_0_40px_rgba(239,68,68,0.15)]",
  },
  {
    title: "Dungeon / Ruin Builder",
    description: "Create reusable dungeon templates with room, hazard, and living-event tables.",
    href: "/worldbuilder/dungeons",
    buttonLabel: "Enter Dungeons",
    iconBg: "bg-slate-500/20",
    dotBg: "bg-slate-300",
    hoverShadow: "hover:shadow-[0_0_40px_rgba(148,163,184,0.15)]",
  },
];

export default async function ToolboxPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <GradientText
            as="h1"
            variant="title"
            glow
            className="font-evanescent text-4xl sm:text-5xl tracking-tight"
          >
            World Builder&apos;s Toolbox
          </GradientText>
          <p className="mt-1 text-sm text-zinc-300/90">
            Create reusable components that you can use across all your worlds.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/worldbuilder">
            <Button variant="secondary" size="sm">
              {"<-"} Source Forge Hub
            </Button>
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto">
        <Card
          variant="subtle"
          padded={false}
          className="mb-8 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4 backdrop-blur"
        >
          <p className="text-sm text-zinc-200 text-center">
            <span className="font-semibold text-amber-200">Build once, use everywhere:</span>{" "}
            Create tools here, then reference them when building in The G.O.D&apos;s Realm.
          </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {TOOL_CARDS.map((tool) => (
            <Card
              key={tool.href}
              padded={false}
              className={[
                "group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl transition",
                tool.hoverShadow,
              ].join(" ")}
            >
              <div className={["mb-3 flex h-12 w-12 items-center justify-center rounded-lg", tool.iconBg].join(" ")}>
                <div className={["h-3 w-3 rounded-full", tool.dotBg].join(" ")} />
              </div>
              <GradientText
                as="h2"
                variant="card-title"
                className="font-portcullion text-lg md:text-xl"
              >
                {tool.title}
              </GradientText>
              <p className="mt-2 text-base text-zinc-300/90">{tool.description}</p>
              <div className="mt-4">
                <Link href={tool.href}>
                  <Button variant="primary" size="sm">
                    {tool.buttonLabel}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        <Card
          variant="subtle"
          padded={false}
          className="mt-10 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4 backdrop-blur"
        >
          <p className="text-sm text-zinc-200">
            Active Tools: <span className="font-medium text-amber-200">{TOOL_CARDS.length}</span> | Coming Soon:{" "}
            <span className="font-medium text-zinc-400">0</span>
          </p>
        </Card>
      </section>
    </main>
  );
}
