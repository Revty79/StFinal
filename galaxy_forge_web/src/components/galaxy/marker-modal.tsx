import { FormEvent, useState } from "react";
import { UpsertMarkerInput } from "@/lib/galaxy/service";
import { EraModel, MarkerModel, MarkerVisibility, SettingModel } from "@/lib/galaxy/types";
import { parseOptionalInteger, readErrorMessage, toInputNumber } from "@/components/galaxy/galaxy-utils";
import { ModalShell } from "@/components/galaxy/modal-primitives";

const inputStyle = "w-full rounded-md border border-[var(--border)] bg-white px-3 py-2";
const VISIBILITY_OPTIONS: MarkerVisibility[] = ["canon", "secret", "rumor"];

export function MarkerFormModal({
  worldId,
  eras,
  settings,
  initial,
  onClose,
  onSave,
}: {
  worldId: string;
  eras: EraModel[];
  settings: SettingModel[];
  initial?: MarkerModel;
  onClose: () => void;
  onSave: (input: UpsertMarkerInput) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [year, setYear] = useState(toInputNumber(initial?.year));
  const [eraId, setEraId] = useState(initial?.eraId ?? "");
  const [settingId, setSettingId] = useState(initial?.settingId ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [visibility, setVisibility] = useState<MarkerVisibility>(initial?.visibility ?? "canon");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Event name is required.");
      return;
    }
    const parsedYear = parseOptionalInteger(year);
    if (parsedYear === null) {
      setError("Year must be an integer.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSave({
        id: initial?.id,
        worldId,
        eraId: eraId || undefined,
        settingId: settingId || undefined,
        name,
        description,
        year: parsedYear,
        category,
        visibility,
      });
    } catch (nextError) {
      setError(readErrorMessage(nextError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell title={initial ? "Edit Event" : "Create Event"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Name *</span>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputStyle}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            className={inputStyle}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Year</span>
            <input
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className={inputStyle}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Visibility</span>
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as MarkerVisibility)}
              className={inputStyle}
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Era</span>
            <select
              value={eraId}
              onChange={(event) => setEraId(event.target.value)}
              className={inputStyle}
            >
              <option value="">Unassigned</option>
              {eras.map((era) => (
                <option key={era.id} value={era.id}>
                  {era.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Setting</span>
            <select
              value={settingId}
              onChange={(event) => setSettingId(event.target.value)}
              className={inputStyle}
            >
              <option value="">Unassigned</option>
              {settings.map((setting) => (
                <option key={setting.id} value={setting.id}>
                  {setting.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Category</span>
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={inputStyle}
          />
        </label>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
