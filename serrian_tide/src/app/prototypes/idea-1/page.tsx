import Link from "next/link";
import { Card } from "@/components/Card";
import { GradientText } from "@/components/GradientText";

const workspaceCards = [
  {
    name: "Forge",
    href: "/prototypes/idea-1/forge/system",
    summary: "Create and organize systems, worlds, and campaigns from one shell.",
  },
  {
    name: "Run",
    href: "/prototypes/idea-1/run",
    summary: "Campaign cockpit for sessions, encounters, notes, and VTT launch.",
  },
  {
    name: "Play",
    href: "/prototypes/idea-1/play",
    summary: "Player-facing dashboard for characters, campaigns, and session joins.",
  },
  {
    name: "Bazaar",
    href: "/prototypes/idea-1/bazaar",
    summary: "Marketplace space for discovery, library management, and installs.",
  },
  {
    name: "Admin",
    href: "/prototypes/idea-1/admin",
    summary: "Operational tools for user management, moderation, and settings.",
  },
];

export default function IdeaOneOverviewPage() {
  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Concept</p>
        <GradientText as="h1" variant="title" className="text-3xl font-semibold">
          One shell, five workspaces
        </GradientText>
        <p className="max-w-3xl text-sm text-slate-300 sm:text-base">
          This prototype demonstrates a single navigation shell with shared scope context.
          Each workspace has its own cockpit while keeping users anchored in one continuous
          app frame.
        </p>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workspaceCards.map((workspace) => (
          <Link key={workspace.name} href={workspace.href} className="block">
            <Card className="h-full space-y-3 transition hover:border-amber-300/60 hover:bg-slate-900/60">
              <h2 className="text-xl font-semibold text-slate-50">{workspace.name}</h2>
              <p className="text-sm text-slate-300">{workspace.summary}</p>
              <p className="text-sm font-medium text-amber-200">Open workspace</p>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
