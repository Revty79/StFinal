import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/session";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { GradientText } from "@/components/GradientText";

export default async function GodsRealmPage() {
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
              The Gods' Realm
            </GradientText>
            <p className="text-xs sm:text-sm text-zinc-300/90 max-w-2xl">
              Design campaigns, plan sessions, and orchestrate epic adventures.
              Welcome to the Game Master's command center.
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
          {/* Create Campaign */}
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <GradientText
              as="h3"
              variant="card-title"
              className="font-portcullion text-xl md:text-2xl mb-3"
            >
              Create Campaign
            </GradientText>
            <p className="text-sm sm:text-base text-zinc-300/90 mb-6">
              Design your campaign world, establish the setting, themes, and overarching narrative.
              Build the foundation for your epic story.
            </p>
            <div className="mt-auto">
              <Link href="/campaign">
                <Button variant="primary" size="md" className="w-full">
                  Start Building
                </Button>
              </Link>
            </div>
          </Card>

          {/* Create Session */}
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <GradientText
              as="h3"
              variant="card-title"
              className="font-portcullion text-xl md:text-2xl mb-3"
            >
              Create Session
            </GradientText>
            <p className="text-sm sm:text-base text-zinc-300/90 mb-6">
              Plan individual game sessions with encounters, NPCs, plot points, and challenges.
              Prepare your next adventure.
            </p>
            <div className="mt-auto">
              <Link href="#">
                <Button variant="primary" size="md" className="w-full" disabled>
                  Coming Soon
                </Button>
              </Link>
            </div>
          </Card>

          {/* Run Session */}
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
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <GradientText
              as="h3"
              variant="card-title"
              className="font-portcullion text-xl md:text-2xl mb-3"
            >
              Run Session
            </GradientText>
            <p className="text-sm sm:text-base text-zinc-300/90 mb-6">
              Execute your session in real-time with live tools, dice rolling, initiative tracking,
              and player management.
            </p>
            <div className="mt-auto">
              <Link href="#">
                <Button variant="primary" size="md" className="w-full" disabled>
                  Coming Soon
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Info Card */}
        <Card
          padded={false}
          className="mt-8 rounded-2xl border border-blue-300/30 bg-blue-300/5 p-5 backdrop-blur"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-400/20">
              <svg
                className="h-5 w-5 text-blue-300"
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
              <p className="text-sm font-semibold text-blue-200 mb-1">
                Game Master Command Center
              </p>
              <p className="text-xs sm:text-sm text-zinc-300/90">
                The Gods' Realm provides comprehensive tools for creating and managing your campaigns.
                Start by building your campaign setting, then plan individual sessions with detailed encounters.
                When you're ready to play, use the Run Session tool for real-time game management with your players.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
