import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/session";
import WorldBuilderCard from "@/components/WorldBuilderCard";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { GradientText } from "@/components/GradientText";
import { LogoutButton } from "@/components/LogoutButton";

// Map role → capabilities
function getCapabilities(role: string) {
  // Normalize safely in case something unexpected slips through
  const r = (role ?? "").toLowerCase();

  const isAdmin = r === "admin";

  // These match your actual DB role codes:
  //   admin
  //   privileged
  //   free
  //   developer? (if you add it later)
  //   world_builder
  //   world_developer
  //   universe_creator
  const canWorldBuild =
    isAdmin ||
    r === "privileged" ||
    r === "world_builder" ||
    r === "world_developer" ||
    r === "universe_creator";

  // Who is allowed to publish/sell in the Bazaar
  const canPublish =
    isAdmin ||
    r === "world_developer" ||
    r === "universe_creator";

  const canSeeAdmin = isAdmin;

  const canAccessSourceForge = isAdmin || r === "privileged";

  return { isAdmin, canWorldBuild, canPublish, canSeeAdmin, canAccessSourceForge };
}

export default async function Dashboard() {
  const user = (await getSessionUser()) as
    | { id: string; username: string; email: string; role: string }
    | null;

  if (!user) redirect("/login");

  const role = user.role.toLowerCase();
  const { isAdmin, canWorldBuild, canPublish, canSeeAdmin, canAccessSourceForge } =
    getCapabilities(role);

  return (
    <main className="min-h-screen px-6 py-10">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <GradientText 
            as="h1" 
            variant="title" 
            glow 
            className="font-evanescent text-3xl sm:text-4xl md:text-5xl tracking-tight"
          >
            Dashboard
          </GradientText>
          <p className="mt-1 text-sm text-zinc-300">Welcome, {user.username}</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Profile button */}
          <Link href="/profile">
            <Button variant="secondary" size="sm">Profile</Button>
          </Link>

          {/* Logout button */}
          <LogoutButton />
        </div>
      </header>

      {/* Cards */}
      <section className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Galaxy Forge / World Builder (now far left) */}
          <WorldBuilderCard canWorldBuild={canWorldBuild} role={role} canAccessSourceForge={canAccessSourceForge} />

          {/* Gods' Realm (everyone) */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl hover:shadow-[0_0_40px_rgba(251,191,36,0.15)] transition"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-400/20">
              <div className="h-3 w-3 rounded-full bg-amber-300" />
            </div>
            <GradientText 
              as="h3" 
              variant="card-title" 
              className="font-portcullion text-lg md:text-xl"
            >
              The Gods' Realm
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Design arcs, sessions, and encounters.
            </p>
            <div className="mt-4">
              <Link href="#">
                <Button variant="primary" size="sm">
                  Build Campaign
                </Button>
              </Link>
            </div>
          </Card>

          {/* Players' Realm (everyone) */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] transition"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-400/20">
              <div className="h-3 w-3 rounded-full bg-emerald-300" />
            </div>
            <GradientText 
              as="h3" 
              variant="card-title" 
              className="font-portcullion text-lg md:text-xl"
            >
              The Players' Realm
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Join a table, track characters, sync sessions.
            </p>
            <div className="mt-4">
              <Link href="#">
                <Button variant="primary" size="sm">
                  Join Campaign
                </Button>
              </Link>
            </div>
          </Card>

          {/* Character Creator (everyone) */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] transition"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-400/20">
              <div className="h-3 w-3 rounded-full bg-violet-300" />
            </div>
            <GradientText 
              as="h3" 
              variant="card-title" 
              className="font-portcullion text-lg md:text-xl"
            >
              Character Creator
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Create and design characters for fun.
            </p>
            <div className="mt-4">
              <Link href="/character-creator">
                <Button variant="primary" size="sm">
                  Create Character
                </Button>
              </Link>
            </div>
          </Card>

          {/* Bazaar (admin/privileged only) */}
          {canAccessSourceForge && (
            <Card
              padded={false}
              className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] transition"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-400/20">
                <div className="h-3 w-3 rounded-full bg-blue-300" />
              </div>
              <GradientText 
                as="h3" 
                variant="card-title" 
                className="font-portcullion text-lg md:text-xl"
              >
                The Bazaar
              </GradientText>
              <p className="mt-2 text-base text-zinc-300/90">
                Grab world packs, tools, and modules.
              </p>
              <div className="mt-4 flex gap-2">
                <Link href="#">
                  <Button variant="primary" size="sm">
                    Enter Shop
                  </Button>
                </Link>
                {canPublish && (
                  <Link href="#">
                    <Button variant="secondary" size="sm">
                      Publish
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Admin Console (admin only) */}
        {canSeeAdmin && (
          <Card
            padded={false}
            className="mt-6 group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl hover:shadow-[0_0_40px_rgba(244,63,94,0.15)] transition"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-rose-500/20">
              <div className="h-3 w-3 rounded-full bg-rose-300" />
            </div>
            <GradientText 
              as="h3" 
              variant="card-title" 
              className="font-portcullion text-lg md:text-xl"
            >
              Admin Console
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Manage users, roles, and world packs.
            </p>
            <div className="mt-4">
              <Link href="#">
                <Button variant="primary" size="sm">
                  Open Console
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Status strip */}
        <Card
          variant="subtle"
          padded={false}
          className="mt-10 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4 backdrop-blur"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-zinc-200">
              Current Role:{" "}
              <span className="font-medium text-amber-200">{role}</span>
            </p>
          </div>
        </Card>
      </section>
    </main>
  );
}
