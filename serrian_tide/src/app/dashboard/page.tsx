import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/session";
import WorldBuilderCard from "@/components/WorldBuilderCard";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

// Map role → capabilities
function getCapabilities(role: string) {
  const r = role.toLowerCase();
  const isAdmin = r === "admin";
  const canWorldBuild =
    isAdmin || r === "worldbuilder" || r === "developer" || r === "privileged";
  const canPublish = isAdmin || r === "developer"; // future: selling in store
  const canSeeAdmin = isAdmin;
  return { isAdmin, canWorldBuild, canPublish, canSeeAdmin };
}

export default async function Dashboard() {
  const user = (await getSessionUser()) as
    | { id: string; username: string; email: string; role: string }
    | null;

  if (!user) redirect("/login");

  const role = user.role.toLowerCase();
  const { isAdmin, canWorldBuild, canPublish, canSeeAdmin } =
    getCapabilities(role);

  return (
    <main className="min-h-screen px-6 py-10">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-evanescent st-title-gradient st-glow text-4xl sm:text-5xl tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-300">Welcome, {user.username}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Profile button */}
          <Link href="/profile">
            <Button variant="secondary">Profile</Button>
          </Link>

          {/* real logout: POST to /api/auth/logout */}
          <form action="/api/auth/logout" method="POST">
            <Button type="submit" variant="primary">
              ← Logout
            </Button>
          </form>
        </div>
      </header>

      {/* Cards */}
      <section className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Galaxy Forge / World Builder (now far left) */}
          <WorldBuilderCard canWorldBuild={canWorldBuild} role={role} />

          {/* Gods' Realm (everyone) */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl hover:shadow-[0_0_40px_rgba(251,191,36,0.15)] transition"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-400/20">
              <div className="h-3 w-3 rounded-full bg-amber-300" />
            </div>
            <h3 className="st-card-title-gradient font-portcullion st-card-title-sm text-lg md:text-xl">
              The Gods’ Realm
            </h3>
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
            <h3 className="st-card-title-gradient font-portcullion st-card-title-sm text-lg md:text-xl">
              The Players’ Realm
            </h3>
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

          {/* Bazaar (everyone can browse; publish needs developer/admin later) */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] transition"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-400/20">
              <div className="h-3 w-3 rounded-full bg-blue-300" />
            </div>
            <h3 className="st-card-title-gradient font-portcullion st-card-title-sm text-lg md:text-xl">
              The Bazaar
            </h3>
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
            <h3 className="st-card-title-gradient font-portcullion st-card-title-sm text-lg md:text-xl">
              Admin Console
            </h3>
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
