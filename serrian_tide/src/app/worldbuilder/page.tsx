import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/session";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { GradientText } from "@/components/GradientText";

type RoleCapabilities = {
  isAdmin: boolean;
  canWorldBuild: boolean;
};

function getCapabilities(role: string | null | undefined): RoleCapabilities {
  const r = (role ?? "").toLowerCase();

  const isAdmin = r === "admin";

  // Match your DB role codes:
  //   admin
  //   privileged
  //   world_builder
  //   world_developer
  //   universe_creator
  //   free
  const canWorldBuild =
    isAdmin ||
    r === "privileged" ||
    r === "world_builder" ||
    r === "world_developer" ||
    r === "universe_creator";

  return { isAdmin, canWorldBuild };
}

export default async function SourceForgePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const { canWorldBuild } = getCapabilities(user.role);

  // If they somehow hit Source Forge without perms, show a clear locked view
  if (!canWorldBuild) {
    return (
      <main className="min-h-screen px-6 py-10">
        <section className="max-w-3xl mx-auto">
          <Card
            padded={false}
            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl"
          >
            <GradientText
              as="h1"
              variant="title"
              glow
              className="font-evanescent text-3xl sm:text-4xl tracking-tight mb-2"
            >
              The Source Forge (Locked)
            </GradientText>
            <p className="text-base text-zinc-300/90">
              Your current role{" "}
              <span className="font-semibold">{user.role}</span> does not have
              world-building permissions yet.
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Only G.O.D-level roles and trusted builders can shape worlds
              here.
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">
                  ← Back to Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  // Unlocked Source Forge hub
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
            The Source Forge
          </GradientText>
          <p className="mt-1 text-sm text-zinc-300/90">
            Welcome, {user.username}. You are G.O.D here. This is where worlds,
            peoples, systems, and stuff all come online.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              ← Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Worlds */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] transition"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/20">
              <div className="h-3 w-3 rounded-full bg-violet-300" />
            </div>
            <GradientText
              as="h2"
              variant="card-title"
              className="font-portcullion text-lg md:text-xl"
            >
              Worlds
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Define the big canvases: cosmology, tone, high-level rules that
              eras, settings, campaigns and sessions will inherit.
            </p>
            <div className="mt-4">
              <Link href="/worldbuilder/worlds">
                <Button variant="primary" size="sm">
                  Enter Worlds
                </Button>
              </Link>
            </div>
          </Card>

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
              Create peoples, lineages, and strange bloodlines that will live
              in your worlds.
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
              Define skills, spell lists, disciplines, and other engines that
              power characters and creatures.
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
              Build monsters, NPCs, and beasts that inhabit your worlds and
              test your tables.
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
              Manage weapons, gear, artifacts, and other tangible stuff that
              flows through your worlds.
            </p>
            <div className="mt-4">
              <Link href="/worldbuilder/inventory">
                <Button variant="primary" size="sm">
                  Enter Inventory
                </Button>
              </Link>
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
            Access:{" "}
            <span className="font-medium text-amber-200">{user.role}</span>{" "}
            (Source Forge enabled)
          </p>
        </Card>
      </section>
    </main>
  );
}
