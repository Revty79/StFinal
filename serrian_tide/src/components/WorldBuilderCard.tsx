import Link from "next/link";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

interface WorldBuilderCardProps {
  canWorldBuild: boolean;
  role: string;
}

export default function WorldBuilderCard({
  canWorldBuild,
  role,
}: WorldBuilderCardProps) {
  if (!canWorldBuild) {
    // Locked view for roles without world-building permissions
    return (
      <Card
        padded={false}
        className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl opacity-70"
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-500/30">
          <div className="h-3 w-3 rounded-full bg-slate-300" />
        </div>
        <h3 className="st-card-title-gradient font-portcullion st-card-title-sm text-lg md:text-xl">
          World Builder (Locked)
        </h3>
        <p className="mt-2 text-base text-zinc-300/90">
          Your current role{" "}
          <span className="font-semibold">{role}</span> does not have
          world-building permissions yet.
        </p>
        <div className="mt-4">
          <Button variant="secondary" size="sm" disabled>
            Access Restricted
          </Button>
        </div>
      </Card>
    );
  }

  // Unlocked view for GMs / dev / privileged
  return (
    <Card
      padded={false}
      className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl hover:shadow-[0_0_40px_rgba(251,191,36,0.2)] transition"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/25">
        <div className="h-3 w-3 rounded-full bg-amber-300" />
      </div>
      <h3 className="st-card-title-gradient font-portcullion st-card-title-sm text-lg md:text-xl">
        The Source Forge
      </h3>
      <p className="mt-2 text-base text-zinc-300/90">
        Create and manage worlds, eras, and settings under your control as
        G.O.D.
      </p>
      <div className="mt-4">
        <Link href="/worldbuilder">
          <Button variant="primary" size="sm">
            Light The Forge
          </Button>
        </Link>
      </div>
    </Card>
  );
}
