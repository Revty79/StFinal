import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/session";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { GradientText } from "@/components/GradientText";

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
              ← Source Forge Hub
            </Button>
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto">
        {/* Info Card */}
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
          {/* Races */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl hover:shadow-[0_0_40px_rgba(52,211,153,0.15)] transition"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20">
              <div className="h-3 w-3 rounded-full bg-emerald-300" />
            </div>
            <GradientText
              as="h2"
              variant="card-title"
              className="font-portcullion text-lg md:text-xl"
            >
              Races
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Create peoples, lineages, and strange bloodlines that will live in your worlds.
            </p>
            <div className="mt-4">
              <Link href="/worldbuilder/races">
                <Button variant="primary" size="sm">
                  Enter Races
                </Button>
              </Link>
            </div>
          </Card>

          {/* Skillsets */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] transition"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20">
              <div className="h-3 w-3 rounded-full bg-blue-300" />
            </div>
            <GradientText
              as="h2"
              variant="card-title"
              className="font-portcullion text-lg md:text-xl"
            >
              Skillsets
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Define skills, spell lists, disciplines, and other engines that power characters and
              creatures.
            </p>
            <div className="mt-4">
              <Link href="/worldbuilder/skillsets">
                <Button variant="primary" size="sm">
                  Enter Skillsets
                </Button>
              </Link>
            </div>
          </Card>

          {/* Creatures */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl hover:shadow-[0_0_40px_rgba(248,113,113,0.15)] transition"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-rose-500/20">
              <div className="h-3 w-3 rounded-full bg-rose-300" />
            </div>
            <GradientText
              as="h2"
              variant="card-title"
              className="font-portcullion text-lg md:text-xl"
            >
              Creatures
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Build monsters, beasts, mounts, pets, and companions that inhabit your worlds and test
              your tables.
            </p>
            <div className="mt-4">
              <Link href="/worldbuilder/creatures">
                <Button variant="primary" size="sm">
                  Enter Creatures
                </Button>
              </Link>
            </div>
          </Card>

          {/* Inventory */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl hover:shadow-[0_0_40px_rgba(251,191,36,0.15)] transition"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/20">
              <div className="h-3 w-3 rounded-full bg-amber-300" />
            </div>
            <GradientText
              as="h2"
              variant="card-title"
              className="font-portcullion text-lg md:text-xl"
            >
              Inventory
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Manage weapons, gear, artifacts, services, and other tangible stuff that flows through
              your worlds.
            </p>
            <div className="mt-4">
              <Link href="/worldbuilder/inventory">
                <Button variant="primary" size="sm">
                  Enter Inventory
                </Button>
              </Link>
            </div>
          </Card>

          {/* NPCs */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] transition"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20">
              <div className="h-3 w-3 rounded-full bg-purple-300" />
            </div>
            <GradientText
              as="h2"
              variant="card-title"
              className="font-portcullion text-lg md:text-xl"
            >
              NPCs
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Create NPCs with personality and story hooks for your worlds and campaigns.
            </p>
            <div className="mt-4">
              <Link href="/worldbuilder/npcs">
                <Button variant="primary" size="sm">
                  Enter NPCs
                </Button>
              </Link>
            </div>
          </Card>

          {/* Calendars */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] transition"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/20">
              <div className="h-3 w-3 rounded-full bg-violet-300" />
            </div>
            <GradientText
              as="h2"
              variant="card-title"
              className="font-portcullion text-lg md:text-xl"
            >
              Calendars
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Design custom calendars with unique days, months, and celestial cycles.
            </p>
            <div className="mt-4">
              <Link href="/worldbuilder/calendars">
                <Button variant="primary" size="sm">
                  Enter Calendars
                </Button>
              </Link>
            </div>
          </Card>

          {/* Factions (Coming Soon) */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl opacity-60"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/20">
              <div className="h-3 w-3 rounded-full bg-indigo-300" />
            </div>
            <GradientText
              as="h2"
              variant="card-title"
              className="font-portcullion text-lg md:text-xl"
            >
              Factions
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Build organizations, guilds, and political powers with goals and relationships.
            </p>
            <div className="mt-4">
              <Button variant="ghost" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </Card>

          {/* World Map Builder (Coming Soon) */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl opacity-60"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20">
              <div className="h-3 w-3 rounded-full bg-emerald-300" />
            </div>
            <GradientText
              as="h2"
              variant="card-title"
              className="font-portcullion text-lg md:text-xl"
            >
              Geography & Regions Builder
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Shape continents, regions, and locations to define the physical canvas of your worlds.
            </p>
            <div className="mt-4">
              <Button variant="ghost" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </Card>

          {/* Plot Hooks (Coming Soon) */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl opacity-60"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-pink-500/20">
              <div className="h-3 w-3 rounded-full bg-pink-300" />
            </div>
            <GradientText
              as="h2"
              variant="card-title"
              className="font-portcullion text-lg md:text-xl"
            >
              Plot Hooks
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Craft reusable story seeds, rumors, and quests to drive your campaigns and sessions.
            </p>
            <div className="mt-4">
              <Button variant="ghost" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </Card>
        </div>

        {/* Status strip */}
        <Card
          variant="subtle"
          padded={false}
          className="mt-10 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4 backdrop-blur"
        >
          <p className="text-sm text-zinc-200">
            Active Tools: <span className="font-medium text-amber-200">6</span> | Coming Soon:{" "}
            <span className="font-medium text-zinc-400">3</span>
          </p>
        </Card>
      </section>
    </main>
  );
}
