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
            Welcome, {user.username}. You are G.O.D here. This is where cosmos,
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
        {/* Info Card */}
        <Card
          variant="subtle"
          padded={false}
          className="mb-8 rounded-2xl border border-violet-300/30 bg-violet-300/5 p-4 backdrop-blur"
        >
          <p className="text-sm text-zinc-200 text-center">
            <span className="font-semibold text-violet-200">Start here:</span> Use the{" "}
            <span className="text-amber-200">World Builder's Toolbox</span> to create reusable components.
            Then head to <span className="text-emerald-200">The G.O.D's Playground</span> to assemble your cosmos.
          </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* World Builder's Toolbox */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 shadow-2xl hover:shadow-[0_0_50px_rgba(251,191,36,0.2)] transition"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-amber-400/20">
              <div className="h-6 w-6 rounded-full bg-amber-300" />
            </div>
            <GradientText
              as="h2"
              variant="card-title"
              className="font-portcullion text-2xl md:text-3xl"
            >
              World Builder's Toolbox
            </GradientText>
            <p className="mt-3 text-base text-zinc-300/90 leading-relaxed">
              Create reusable components: races, creatures, skills, inventory, calendars, factions, magic systems, and more.
            </p>
            
            <div className="mt-6">
              <Link href="/worldbuilder/toolbox">
                <Button variant="primary" size="md" className="w-full">
                  Open Toolbox
                </Button>
              </Link>
            </div>
          </Card>

          {/* The G.O.D's Playground */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 shadow-2xl hover:shadow-[0_0_50px_rgba(167,139,250,0.2)] transition"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-violet-400/20">
              <div className="h-6 w-6 rounded-full bg-violet-300" />
            </div>
            <GradientText
              as="h2"
              variant="card-title"
              className="font-portcullion text-2xl md:text-3xl"
            >
              The G.O.D's Playground
            </GradientText>
            <p className="mt-3 text-base text-zinc-300/90 leading-relaxed">
              Assemble complete cosmos by combining your tools and defining cosmology, eras, and the rules that govern reality.
            </p>
            
            <div className="mt-6">
              <Link href="/worldbuilder/playground">
                <Button variant="primary" size="md" className="w-full">
                  Enter Playground
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
