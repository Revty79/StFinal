import { Card } from "@/components/Card";
import { ForgeTabs } from "./_components/forge-tabs";

export default function ForgeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-slate-50">Forge Workspace</h2>
          <p className="text-sm text-slate-300">
            Build content across System, World, and Campaign levels.
          </p>
        </div>
        <ForgeTabs />
      </Card>

      {children}
    </div>
  );
}
