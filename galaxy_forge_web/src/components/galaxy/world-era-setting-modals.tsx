import { FormEvent, useState } from "react";
import { UpsertEraInput, UpsertSettingInput, UpsertWorldInput } from "@/lib/galaxy/service";
import { EraModel, SettingModel, WorldSummary } from "@/lib/galaxy/types";
import {
  parseOptionalInteger,
  readErrorMessage,
  toInputNumber,
  normalizeHexColor,
} from "@/components/galaxy/galaxy-utils";
import { ColorPickerField, ModalShell } from "@/components/galaxy/modal-primitives";

const inputStyle = "w-full rounded-md border border-[var(--border)] bg-white px-3 py-2";

export function WorldFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: WorldSummary;
  onClose: () => void;
  onSave: (input: UpsertWorldInput) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("World name is required.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSave({
        id: initial?.id,
        name,
        description,
      });
    } catch (nextError) {
      setError(readErrorMessage(nextError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell title={initial ? "Edit World" : "Create World"} onClose={onClose}>
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
            rows={3}
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

export function EraFormModal({
  worldId,
  initial,
  onClose,
  onSave,
}: {
  worldId: string;
  initial?: EraModel;
  onClose: () => void;
  onSave: (input: UpsertEraInput) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startYear, setStartYear] = useState(toInputNumber(initial?.startYear));
  const [endYear, setEndYear] = useState(toInputNumber(initial?.endYear));
  const [colorHex, setColorHex] = useState<string | undefined>(normalizeHexColor(initial?.colorHex));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Era name is required.");
      return;
    }
    const parsedStartYear = parseOptionalInteger(startYear);
    const parsedEndYear = parseOptionalInteger(endYear);
    if (parsedStartYear === null || parsedEndYear === null) {
      setError("Year values must be integers.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSave({
        id: initial?.id,
        worldId,
        name,
        description,
        startYear: parsedStartYear,
        endYear: parsedEndYear,
        colorHex,
      });
    } catch (nextError) {
      setError(readErrorMessage(nextError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell title={initial ? "Edit Era" : "Create Era"} onClose={onClose}>
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
            <span className="text-sm font-medium">Start year</span>
            <input
              value={startYear}
              onChange={(event) => setStartYear(event.target.value)}
              className={inputStyle}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">End year</span>
            <input
              value={endYear}
              onChange={(event) => setEndYear(event.target.value)}
              className={inputStyle}
            />
          </label>
        </div>
        <ColorPickerField label="Color" value={colorHex} onChange={setColorHex} />
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

export function SettingFormModal({
  worldId,
  eras,
  initial,
  onClose,
  onSave,
}: {
  worldId: string;
  eras: EraModel[];
  initial?: SettingModel;
  onClose: () => void;
  onSave: (input: UpsertSettingInput) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startYear, setStartYear] = useState(toInputNumber(initial?.startYear));
  const [endYear, setEndYear] = useState(toInputNumber(initial?.endYear));
  const [eraId, setEraId] = useState(initial?.eraId ?? "");
  const [colorHex, setColorHex] = useState<string | undefined>(normalizeHexColor(initial?.colorHex));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Setting name is required.");
      return;
    }
    const parsedStartYear = parseOptionalInteger(startYear);
    const parsedEndYear = parseOptionalInteger(endYear);
    if (parsedStartYear === null || parsedEndYear === null) {
      setError("Year values must be integers.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSave({
        id: initial?.id,
        worldId,
        eraId: eraId || undefined,
        name,
        description,
        startYear: parsedStartYear,
        endYear: parsedEndYear,
        colorHex,
      });
    } catch (nextError) {
      setError(readErrorMessage(nextError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell title={initial ? "Edit Setting" : "Create Setting"} onClose={onClose}>
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
            <span className="text-sm font-medium">Start year</span>
            <input
              value={startYear}
              onChange={(event) => setStartYear(event.target.value)}
              className={inputStyle}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">End year</span>
            <input
              value={endYear}
              onChange={(event) => setEndYear(event.target.value)}
              className={inputStyle}
            />
          </label>
        </div>
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
        <ColorPickerField label="Color" value={colorHex} onChange={setColorHex} />
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
