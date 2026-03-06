import { Card } from "@/components/Card";

const scopeFields = [
  { id: "world", label: "World", placeholder: "Select world (placeholder)" },
  { id: "setting", label: "Setting", placeholder: "Select setting (placeholder)" },
  { id: "campaign", label: "Campaign", placeholder: "Select campaign (placeholder)" },
];

export function ScopeBar() {
  return (
    <Card className="space-y-3">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Scope Bar</h2>
        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Visual only</p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        {scopeFields.map((field) => (
          <div key={field.id} className="rounded-xl border border-slate-700/70 bg-slate-900/30 p-3">
            <label htmlFor={field.id} className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {field.label}
            </label>
            <select
              id={field.id}
              className="mt-2 w-full rounded-lg border border-slate-600/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-300/70"
              defaultValue=""
            >
              <option value="">{field.placeholder}</option>
            </select>
            <p className="mt-2 text-xs text-slate-400">Not scoped</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
