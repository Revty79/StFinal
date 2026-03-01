import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { GradientText } from "@/components/GradientText";

type SearchParams = Record<string, string | string[] | undefined>;

type ComingSoonPageProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

function getFirst(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function toLabel(value: string | null, fallback: string): string {
  if (!value) return fallback;

  const normalized = value
    .replace(/[-_]+/g, " ")
    .trim()
    .toLowerCase();

  if (!normalized) return fallback;

  return normalized.replace(/\b\w/g, (match) => match.toUpperCase());
}

function getBackHref(value: string | null): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  return value;
}

export default async function ComingSoonPage({ searchParams }: ComingSoonPageProps) {
  const resolved = (searchParams ? await searchParams : {}) as SearchParams;

  const tool = toLabel(getFirst(resolved.tool), "This Tool");
  const realm = toLabel(getFirst(resolved.realm), "Platform");
  const backHref = getBackHref(getFirst(resolved.back));
  const backLabel = backHref === "/dashboard" ? "Return to Dashboard" : "Back";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <Card
        padded={false}
        className="max-w-2xl w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 shadow-2xl text-center"
      >
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-400/20">
            <div className="h-8 w-8 rounded-full bg-amber-300" />
          </div>
        </div>

        <GradientText
          as="h1"
          variant="title"
          glow
          className="font-evanescent text-4xl sm:text-5xl tracking-tight mb-4"
        >
          Coming Soon
        </GradientText>

        <p className="text-lg text-zinc-200 mb-2">{tool} is still under development.</p>
        <p className="text-sm text-zinc-400 mb-8">Realm: {realm}</p>

        <Link href={backHref}>
          <Button variant="primary" size="md">
            {backLabel}
          </Button>
        </Link>
      </Card>
    </main>
  );
}
