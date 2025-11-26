import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/session";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { GradientText } from "@/components/GradientText";

export default async function FreeToolsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-6 py-10">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <GradientText
            as="h1"
            variant="title"
            glow
            className="font-evanescent text-4xl sm:text-5xl tracking-tight"
          >
            Free Tools
          </GradientText>
          <p className="mt-1 text-sm text-zinc-300/90">
            Access character builders and helpful calculators
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
            <span className="font-semibold text-violet-200">Free for everyone:</span>{" "}
            These tools are available to all users regardless of subscription level.
          </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Character Builder */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] transition"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20">
              <div className="h-3 w-3 rounded-full bg-emerald-300" />
            </div>
            <GradientText
              as="h2"
              variant="card-title"
              className="font-portcullion text-lg md:text-xl"
            >
              Character Builder
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Create and manage your player characters with full stat tracking, skill allocation, and equipment management.
            </p>
            <div className="mt-4">
              <Link href="/free-tools/character-builder">
                <Button variant="primary" size="sm">
                  Build Character
                </Button>
              </Link>
            </div>
          </Card>

          {/* Spell Calculator */}
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
              Spell Calculator
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Calculate spell costs, effects, and modifiers. Perfect for quickly building custom spells on the fly.
            </p>
            <div className="mt-4">
              <Link href="/spell-calculator">
                <Button variant="primary" size="sm">
                  Open Calculator
                </Button>
              </Link>
            </div>
          </Card>

          {/* Coming Soon - Dice Roller */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl opacity-60"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/20">
              <div className="h-3 w-3 rounded-full bg-amber-300" />
            </div>
            <GradientText
              as="h2"
              variant="card-title"
              className="font-portcullion text-lg md:text-xl"
            >
              Dice Roller
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Advanced dice roller with custom formulas, modifiers, and roll history tracking.
            </p>
            <div className="mt-4">
              <Button variant="ghost" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </Card>

          {/* Coming Soon - Initiative Tracker */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl opacity-60"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-rose-500/20">
              <div className="h-3 w-3 rounded-full bg-rose-300" />
            </div>
            <GradientText
              as="h2"
              variant="card-title"
              className="font-portcullion text-lg md:text-xl"
            >
              Initiative Tracker
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Track combat initiative, manage turn order, and keep encounters flowing smoothly.
            </p>
            <div className="mt-4">
              <Button variant="ghost" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </Card>

          {/* Coming Soon - Loot Generator */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl opacity-60"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20">
              <div className="h-3 w-3 rounded-full bg-blue-300" />
            </div>
            <GradientText
              as="h2"
              variant="card-title"
              className="font-portcullion text-lg md:text-xl"
            >
              Loot Generator
            </GradientText>
            <p className="mt-2 text-base text-zinc-300/90">
              Generate random treasure, equipment, and rewards based on challenge rating and genre.
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
          className="mt-10 rounded-2xl border border-violet-300/30 bg-violet-300/5 p-4 backdrop-blur"
        >
          <p className="text-sm text-zinc-200">
            Active Tools: <span className="font-medium text-violet-200">2</span> | Coming Soon:{" "}
            <span className="font-medium text-zinc-400">3</span>
          </p>
        </Card>
      </section>
    </main>
  );
}
