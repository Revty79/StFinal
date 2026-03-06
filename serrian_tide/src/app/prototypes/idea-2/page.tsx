import Link from "next/link";
import { Card } from "@/components/Card";

export default function IdeaTwoPlaceholderPage() {
  return (
    <main className="min-h-screen px-4 py-10 text-slate-100 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="space-y-4">
          <h1 className="text-3xl font-semibold text-slate-50">Idea 2</h1>
          <p className="text-sm text-slate-300 sm:text-base">
            Placeholder page. This route exists so the prototypes index has no dead links.
          </p>
          <Link href="/prototypes" className="text-sm font-medium text-amber-200 hover:text-amber-100">
            Back to Prototypes
          </Link>
        </Card>
      </div>
    </main>
  );
}
