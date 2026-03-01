import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/session";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { GradientText } from "@/components/GradientText";

export default async function PlayersRealmPage() {
  const user = (await getSessionUser()) as
    | { id: string; username: string; email: string; role: string }
    | null;

  if (!user) redirect("/login");

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-6 sm:mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <GradientText
              as="h1"
              variant="title"
              glow
              className="font-evanescent text-2xl sm:text-3xl md:text-4xl tracking-tight"
            >
              The Players' Realm
            </GradientText>
            <p className="text-xs sm:text-sm text-zinc-300/90 max-w-2xl">
              Manage your characters, track sessions, and join adventures.
              Your gateway to epic campaigns and collaborative storytelling.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Cards */}
      <section className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Characters */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] transition"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-violet-400/20">
              <svg
                className="h-7 w-7 text-violet-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <GradientText
              as="h3"
              variant="card-title"
              className="font-portcullion text-xl md:text-2xl mb-3"
            >
              Characters
            </GradientText>
            <p className="text-sm sm:text-base text-zinc-300/90 mb-6">
              Create and manage your player characters across all your campaigns.
              Build heroes, track progress, and evolve your story.
            </p>
            <div className="mt-auto">
              <Link href="/players-realm/characters">
                <Button variant="primary" size="md" className="w-full">
                  Manage Characters
                </Button>
              </Link>
            </div>
          </Card>

          {/* Sessions */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] transition"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-400/20">
              <svg
                className="h-7 w-7 text-emerald-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <GradientText
              as="h3"
              variant="card-title"
              className="font-portcullion text-xl md:text-2xl mb-3"
            >
              Sessions
            </GradientText>
            <p className="text-sm sm:text-base text-zinc-300/90 mb-6">
              View upcoming and past game sessions. Track your campaign progress,
              review session notes, and prepare for adventures.
            </p>
            <div className="mt-auto">
              <Link href="/coming-soon?realm=players-realm&tool=sessions&back=/players-realm">
                <Button variant="primary" size="md" className="w-full">
                  Coming Soon
                </Button>
              </Link>
            </div>
          </Card>

          {/* Join Session */}
          <Card
            padded={false}
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl hover:shadow-[0_0_40px_rgba(251,191,36,0.15)] transition"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-amber-400/20">
              <svg
                className="h-7 w-7 text-amber-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <GradientText
              as="h3"
              variant="card-title"
              className="font-portcullion text-xl md:text-2xl mb-3"
            >
              Join Session
            </GradientText>
            <p className="text-sm sm:text-base text-zinc-300/90 mb-6">
              Enter an active game session with your character. Connect with your party,
              roll dice, and experience the adventure in real-time.
            </p>
            <div className="mt-auto">
              <Link href="/coming-soon?realm=players-realm&tool=join-session&back=/players-realm">
                <Button variant="primary" size="md" className="w-full">
                  Coming Soon
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Info Card */}
        <Card
          padded={false}
          className="mt-8 rounded-2xl border border-emerald-300/30 bg-emerald-300/5 p-5 backdrop-blur"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-400/20">
              <svg
                className="h-5 w-5 text-emerald-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-200 mb-1">
                Player Command Center
              </p>
              <p className="text-xs sm:text-sm text-zinc-300/90">
                Welcome to your player hub! Manage all your characters across multiple campaigns,
                stay updated on upcoming sessions, and jump into live games when they begin.
                Start by creating or selecting a character to prepare for your next adventure.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
