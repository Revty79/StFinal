import Link from "next/link";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { GradientText } from "@/components/GradientText";

interface WorldBuilderCardProps {
  canWorldBuild: boolean;
  role: string;
  canAccessSourceForge: boolean;
}

export default function WorldBuilderCard({
  canWorldBuild,
  role,
  canAccessSourceForge,
}: WorldBuilderCardProps) {
  // Only show Source Forge card to admin or privileged users
  if (!canAccessSourceForge) {
    return null;
  }

  return (
    <Card
      padded={false}
      className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl hover:shadow-[0_0_40px_rgba(251,191,36,0.2)] transition"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/25">
        <div className="h-3 w-3 rounded-full bg-amber-300" />
      </div>
      <GradientText 
        as="h3" 
        variant="card-title" 
        className="font-portcullion text-lg md:text-xl"
      >
        The Source Forge
      </GradientText>
      <p className="mt-2 text-base text-zinc-300/90">
        Create and manage worlds, eras, and settings under your control as
        G.O.D.
      </p>
      <div className="mt-4">
        <Link href={canAccessSourceForge ? "/worldbuilder" : "/worldbuilder/coming-soon"}>
          <Button variant="primary" size="sm">
            Light The Forge
          </Button>
        </Link>
      </div>
    </Card>
  );
}
