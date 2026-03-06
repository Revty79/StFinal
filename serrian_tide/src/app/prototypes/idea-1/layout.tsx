import Link from "next/link";
import { Card } from "@/components/Card";
import { GradientText } from "@/components/GradientText";
import { ScopeBar } from "./_components/scope-bar";
import { WorkspaceSwitcher } from "./_components/workspace-switcher";

export default function IdeaOneLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-screen px-4 py-6 text-slate-100 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:flex-row">
        <aside className="lg:sticky lg:top-4 lg:h-fit lg:w-64 lg:shrink-0">
          <Card className="space-y-4">
            <header className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prototype</p>
              <GradientText as="h1" variant="card-title" className="text-2xl font-semibold">
                Idea 1
              </GradientText>
              <p className="text-sm text-slate-300">One shell, five workspaces</p>
            </header>

            <WorkspaceSwitcher />

            <Link
              href="/prototypes/idea-1"
              className="block text-sm font-medium text-amber-200 hover:text-amber-100"
            >
              View concept overview
            </Link>
          </Card>
        </aside>

        <section className="min-w-0 flex-1 space-y-4">
          <ScopeBar />
          {children}
        </section>
      </div>
    </main>
  );
}
