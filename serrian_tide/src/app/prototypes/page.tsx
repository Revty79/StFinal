import Link from "next/link";
import { Card } from "@/components/Card";
import { GradientText } from "@/components/GradientText";

const prototypeLinks = [
  {
    title: "Idea 1",
    description: "One shell, five workspaces",
    href: "/prototypes/idea-1",
  },
  {
    title: "Idea 2",
    description: "Placeholder route for upcoming prototype",
    href: "/prototypes/idea-2",
  },
  {
    title: "Idea 3",
    description: "Placeholder route for upcoming prototype",
    href: "/prototypes/idea-3",
  },
];

export default function PrototypesIndexPage() {
  return (
    <main className="min-h-screen px-4 py-10 text-slate-100 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Prototype Hub
          </p>
          <GradientText as="h1" variant="title" className="text-4xl font-semibold">
            Serrian Tide Prototypes
          </GradientText>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Explore shell concepts for the multi-workspace experience.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {prototypeLinks.map((prototype) => (
            <Link key={prototype.href} href={prototype.href} className="block">
              <Card className="h-full space-y-3 transition hover:border-amber-300/60 hover:bg-slate-900/60">
                <h2 className="text-xl font-semibold text-slate-50">{prototype.title}</h2>
                <p className="text-sm text-slate-300">{prototype.description}</p>
                <p className="text-sm font-medium text-amber-200">Open prototype</p>
              </Card>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
