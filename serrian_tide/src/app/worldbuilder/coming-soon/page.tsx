import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { GradientText } from "@/components/GradientText";

export default function ComingSoon() {
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

        <p className="text-lg text-zinc-300/90 mb-3">
          The Source Forge is currently in development.
        </p>
        
        <p className="text-base text-zinc-400 mb-8">
          This feature will be available soon for select roles. Check back later!
        </p>

        <Link href="/dashboard">
          <Button variant="primary" size="md">
            Return to Dashboard
          </Button>
        </Link>
      </Card>
    </main>
  );
}
