"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { GradientText } from "@/components/GradientText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { Input } from "@/components/Input";
import { WBNav } from "@/components/worldbuilder/WBNav";

/* ---------- types & helpers ---------- */

type ShopRole = "loot_only" | "shop_stock" | "exclusive" | null;

export type CompanionRow = {
  id: string | number;
  name: string;

  is_free?: boolean;
  createdBy?: string;

  timeline_tag?: string | null;
  cost_credits?: number | null;

  role?: "pet" | "mount" | "companion" | string | null;
  linked_creature_id?: string | null;
  genre_tags?: string | null;

  mechanical_effect?: string | null;
  care_difficulty?: string | null;
  narrative_notes?: string | null;

  shop_ready?: boolean;
  shop_role?: ShopRole;
};

const uid = () => Math.random().toString(36).slice(2, 10);
const nv = (x: unknown) =>
  x === null || x === undefined || x === "" ? "—" : String(x);

const GENRE_PRESETS = [
  "familiar",
  "war_mount",
  "spirit",
  "construct",
  "animal",
  "celestial",
  "fiendish",
] as const;

/* ---------- main page ---------- */

export default function InventoryCompanionsPage() {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/worldbuilder/inventory");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const [companions, setCompanions] = useState<CompanionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [qtext, setQtext] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    async function loadCompanions() {
      try {
        const userRes = await fetch("/api/profile/me");
        const userData = await userRes.json();
        if (userData.ok && userData.user) {
          setCurrentUser({ id: userData.user.id, role: userData.user.role });
        }

        const res = await fetch("/api/worldbuilder/inventory/companions");
        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error || "Failed to load companions");
        }

        const mapped: CompanionRow[] = (data.companions || []).map(
          (c: any) => ({
            ...c,
            is_free: c.isFree,
            shop_ready: c.shopReady,
            shop_role: c.shopRole ?? null,
          })
        );

        setCompanions(mapped);
        if (mapped.length > 0 && mapped[0]) {
          setSelectedId(String(mapped[0].id));
        }
      } catch (err) {
        console.error("Error loading companions:", err);
        alert(
          `Failed to load companions: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    }

    loadCompanions();
  }, []);

  const filteredCompanions = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    if (!q) return companions;
    return companions.filter((r) => {
      const base = [
        r.name,
        r.role ?? "",
        r.genre_tags ?? "",
        r.linked_creature_id ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return base.includes(q);
    });
  }, [companions, qtext]);

  const selected: CompanionRow | null = useMemo(
    () =>
      filteredCompanions.find(
        (r) => String(r.id) === String(selectedId ?? "")
      ) ?? null,
    [filteredCompanions, selectedId]
  );

  useEffect(() => {
    if (!filteredCompanions.length) {
      setSelectedId(null);
      return;
    }
    if (!selected && filteredCompanions[0]) {
      setSelectedId(String(filteredCompanions[0].id));
    }
  }, [filteredCompanions, selected]);

  /* ---------- helpers ---------- */

  function createCompanion() {
    const id = uid();
    const row: CompanionRow = {
      id,
      name: "New Companion",
      is_free: false,
      shop_ready: true,
      shop_role: "shop_stock",
      timeline_tag: null,
      cost_credits: null,
      role: "companion",
      linked_creature_id: "",
      genre_tags: "",
      mechanical_effect: "",
      care_difficulty: "",
      narrative_notes: "",
    };
    setCompanions((prev) => [row, ...prev]);
    setSelectedId(id);
  }

  async function deleteSelected() {
    if (!selected || !currentUser) return;
    const idStr = String(selected.id);

    const isNew = typeof selected.id === "string" && selected.id.length < 20;
    const isAdmin = currentUser.role?.toLowerCase() === "admin";
    const isCreator = selected.createdBy === currentUser.id;

    if (!isNew && !isAdmin && !isCreator) {
      alert(
        "You can only delete companions you created (admins can delete any)."
      );
      return;
    }

    if (!confirm("Delete this companion from the inventory?")) return;

    const removeFromState = () => {
      setCompanions((prev) => prev.filter((r) => String(r.id) !== idStr));
    };

    if (isNew) {
      removeFromState();
      setSelectedId(null);
      return;
    }

    try {
      const res = await fetch(
        `/api/worldbuilder/inventory/companions/${selected.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to delete companion");
      }
      removeFromState();
      setSelectedId(null);
      alert("Companion deleted.");
    } catch (err) {
      console.error("Error deleting companion:", err);
      alert(
        `Failed to delete companion: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }

  function renameSelected(newName: string) {
    if (!selected) return;
    const idStr = String(selected.id);
    setCompanions((prev) =>
      prev.map((r) => (String(r.id) === idStr ? { ...r, name: newName } : r))
    );
  }

  function updateSelected(patch: Partial<CompanionRow>) {
    if (!selected) return;
    const idStr = String(selected.id);
    setCompanions((prev) =>
      prev.map((r) =>
        String(r.id) === idStr ? ({ ...r, ...patch } as CompanionRow) : r
      )
    );
  }

  async function saveSelected() {
    if (!selected) return;

    try {
      const isNew = typeof selected.id === "string" && selected.id.length < 20;

      const payload: any = {
        name: selected.name,
        isFree: selected.is_free ?? false,
        shopReady: selected.shop_ready ?? true,
        shopRole: selected.shop_role ?? "shop_stock",
        timelineTag: selected.timeline_tag ?? null,
        costCredits: selected.cost_credits ?? null,
        role: selected.role ?? null,
        linkedCreatureId: selected.linked_creature_id ?? null,
        genreTags: selected.genre_tags ?? null,
        mechanicalEffect: selected.mechanical_effect ?? null,
        careDifficulty: selected.care_difficulty ?? null,
        narrativeNotes: selected.narrative_notes ?? null,
      };

      let res;
      if (isNew) {
        res = await fetch("/api/worldbuilder/inventory/companions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(
          `/api/worldbuilder/inventory/companions/${selected.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to save companion");
      }

      if (isNew) {
        const oldId = selected.id;
        const saved = data.companion;
        if (saved) {
          const transformed: CompanionRow = {
            ...saved,
            is_free: saved.isFree,
            shop_ready: saved.shopReady,
            shop_role: saved.shopRole ?? null,
          };
          setCompanions((prev) =>
            prev.map((r) =>
              String(r.id) === String(oldId) ? transformed : r
            )
          );
          setSelectedId(String(saved.id));
        }
      }

      alert("Companion saved.");
    } catch (err) {
      console.error("Error saving companion:", err);
      alert(
        `Failed to save companion: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }

  function appendGenreTag(tag: string) {
    if (!selected) return;
    const current = selected.genre_tags ?? "";
    const bits = current
      .split(/[,\s]+/)
      .map((b) => b.trim())
      .filter(Boolean);
    if (bits.includes(tag)) return;
    const next = [...bits, tag].join(", ");
    updateSelected({ genre_tags: next });
  }

  const previewText = useMemo(() => {
    if (!selected) return "";
    const c = selected;
    const lines: string[] = [];

    lines.push(`Companion: ${c.name}`);
    lines.push(
      `Role: ${nv(c.role)}   Linked Creature: ${nv(c.linked_creature_id)}`
    );
    lines.push(
      `Timeline: ${nv(c.timeline_tag)}   Cost: ${nv(c.cost_credits)}`
    );
    lines.push(`Tags: ${nv(c.genre_tags)}`);
    lines.push("");
    lines.push(`Effect: ${nv(c.mechanical_effect)}`);
    if (c.care_difficulty) {
      lines.push("");
      lines.push(`Care / Logistics: ${c.care_difficulty}`);
    }
    if (c.narrative_notes) {
      lines.push("");
      lines.push("Notes:");
      lines.push(c.narrative_notes);
    }

    return lines.join("\n");
  }, [selected]);

  /* ---------- render ---------- */

  return (
    <main className="min-h-screen px-6 py-10">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <GradientText
              as="h1"
              variant="title"
              glow
              className="font-evanescent text-3xl sm:text-4xl tracking-tight"
            >
              Pets, Mounts &amp; Companions Builder
            </GradientText>
            <p className="mt-2 text-sm text-zinc-300/90 max-w-2xl">
              Bought, bonded, or summoned allies that ride with the party and
              matter mechanically and narratively. This window links them to
              your Creatures DB and captures their table impact.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Link href="/worldbuilder/toolbox">
              <Button variant="secondary" size="sm" type="button">
                ← Toolbox
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex justify-end">
          <WBNav current="inventory" />
        </div>
      </header>

      {/* Quick help */}
      <section className="max-w-7xl mx-auto mb-4">
        <Card className="bg-white/5 border border-white/10 rounded-3xl p-4 shadow-lg">
          <h2 className="text-sm font-semibold text-zinc-200 mb-1">
            How this window works
          </h2>
          <ol className="list-decimal pl-5 text-xs text-zinc-300 space-y-1">
            <li>
              Use the library on the left to search and select companions,
              mounts, and pets.
            </li>
            <li>
              Link them to creature entries and define their bonuses, actions,
              and care requirements in the editor.
            </li>
            <li>
              Use the preview on the right when assigning them to characters or
              encounters.
            </li>
          </ol>
        </Card>
      </section>

      {/* Main layout */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[320px,1.4fr,1.1fr] gap-6">
        {/* LEFT: library */}
        <Card
          padded={false}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-4 shadow-2xl flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-200">
              Companions Library
            </h2>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={createCompanion}
            >
              + New Companion
            </Button>
          </div>

          <Input
            value={qtext}
            onChange={(e) => setQtext(e.target.value)}
            placeholder="Search by name, role, tags, or creature id…"
          />

          <div className="mt-2 flex-1 min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 border-b border-white/10">
              <span>Companions: {filteredCompanions.length}</span>
              <span className="uppercase tracking-wide text-[10px] text-zinc-500">
                Library
              </span>
            </div>

            <div className="max-h-[420px] overflow-auto">
              {loading ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">
                  Loading companions…
                </div>
              ) : filteredCompanions.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">
                  No companions yet. Bond your first ally.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-left text-zinc-400">
                    <tr>
                      <th className="px-3 py-1">Name</th>
                      <th className="px-3 py-1">Role</th>
                      <th className="px-3 py-1">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanions.map((r) => {
                      const idStr = String(r.id);
                      const isSel = selectedId === idStr;
                      return (
                        <tr
                          key={idStr}
                          className={`border-t border-white/5 cursor-pointer hover:bg-white/5 ${
                            isSel ? "bg-white/10" : ""
                          }`}
                          onClick={() => setSelectedId(idStr)}
                        >
                          <td className="px-3 py-1.5">
                            {r.name || "(unnamed)"}
                          </td>
                          <td className="px-3 py-1.5">{nv(r.role ?? "")}</td>
                          <td className="px-3 py-1.5">
                            {nv(r.cost_credits ?? "")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span>Rename:</span>
                <input
                  className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-xs text-zinc-100 outline-none"
                  disabled={!selected}
                  value={selected?.name ?? ""}
                  onChange={(e) => renameSelected(e.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={
                  !selected ||
                  !currentUser ||
                  (currentUser.role?.toLowerCase() !== "admin" &&
                    selected?.createdBy !== currentUser.id)
                }
                onClick={deleteSelected}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>

        {/* MIDDLE: editor */}
        <Card
          padded={false}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl"
        >
          {selected ? (
            <div className="space-y-4">
              {/* name + save + flags */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <FormField
                    label="Companion Name"
                    htmlFor="companion-name"
                    description="What players will call them."
                  >
                    <Input
                      id="companion-name"
                      value={selected.name}
                      onChange={(e) =>
                        updateSelected({ name: e.target.value })
                      }
                    />
                  </FormField>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.is_free ?? false}
                      onChange={(e) =>
                        updateSelected({ is_free: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-white/20 bg-black/30 text-violet-500 focus:ring-violet-500/50"
                    />
                    <span className="text-xs text-zinc-300">
                      Free (available to all users)
                    </span>
                  </label>
                </div>
                <div className="shrink-0 flex items-end">
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    onClick={saveSelected}
                  >
                    Save Companion
                  </Button>
                </div>
              </div>

              {/* role + creature link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Role"
                  htmlFor="companion-role"
                  description="Pet, mount, or full companion."
                >
                  <select
                    id="companion-role"
                    className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={selected.role ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        role: e.target.value || null,
                      })
                    }
                  >
                    <option value="">(unset)</option>
                    <option value="pet">Pet</option>
                    <option value="mount">Mount</option>
                    <option value="companion">Companion</option>
                  </select>
                </FormField>

                <FormField
                  label="Linked Creature ID"
                  htmlFor="companion-creature"
                  description="Later this will be a picker from Creatures; for now, use the id/key."
                >
                  <Input
                    id="companion-creature"
                    value={selected.linked_creature_id ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        linked_creature_id: e.target.value,
                      })
                    }
                  />
                </FormField>
              </div>

              {/* timeline / cost */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label="Timeline Tag" htmlFor="companion-timeline">
                  <Input
                    id="companion-timeline"
                    value={selected.timeline_tag ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        timeline_tag: e.target.value,
                      })
                    }
                  />
                </FormField>
                <FormField label="Cost (Credits)" htmlFor="companion-cost">
                  <Input
                    id="companion-cost"
                    type="number"
                    value={selected.cost_credits ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        cost_credits:
                          e.target.value === ""
                            ? null
                            : Number(e.target.value),
                      })
                    }
                  />
                </FormField>
              </div>

              {/* tags */}
              <FormField
                label="Genre Tags"
                htmlFor="companion-tags"
                description="Comma- or space-separated; use chips to append."
              >
                <div className="space-y-2">
                  <Input
                    id="companion-tags"
                    value={selected.genre_tags ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        genre_tags: e.target.value,
                      })
                    }
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {GENRE_PRESETS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => appendGenreTag(tag)}
                        className="rounded-full border border-violet-400/40 bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-100 hover:bg-violet-500/20 transition"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </FormField>

              {/* mechanical / care / notes */}
              <FormField
                label="Mechanical Effect"
                htmlFor="companion-effect"
                description="Bonuses, extra actions, travel advantages, or other mechanical hooks."
              >
                <textarea
                  id="companion-effect"
                  className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                  value={selected.mechanical_effect ?? ""}
                  onChange={(e) =>
                    updateSelected({
                      mechanical_effect: e.target.value,
                    })
                  }
                />
              </FormField>

              <FormField
                label="Care / Logistics"
                htmlFor="companion-care"
                description="Upkeep, stabling, food, temperament, or any leash the GM can tug."
              >
                <textarea
                  id="companion-care"
                  className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                  value={selected.care_difficulty ?? ""}
                  onChange={(e) =>
                    updateSelected({
                      care_difficulty: e.target.value,
                    })
                  }
                />
              </FormField>

              <FormField
                label="Narrative Notes"
                htmlFor="companion-notes"
                description="Personality, backstory, quirks, bonds to PCs."
              >
                <textarea
                  id="companion-notes"
                  className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                  value={selected.narrative_notes ?? ""}
                  onChange={(e) =>
                    updateSelected({
                      narrative_notes: e.target.value,
                    })
                  }
                />
              </FormField>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">
              No companion selected. Create or select one from the library.
            </p>
          )}
        </Card>

        {/* RIGHT: preview */}
        <Card className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-4 shadow-xl">
          <FormField
            label="Companion Preview"
            htmlFor="companion-preview"
            description="Copy-paste ready block for sheets, sidebars, and encounter notes."
          >
            <textarea
              id="companion-preview"
              readOnly
              className="w-full h-[320px] rounded-lg border border-white/10 bg-neutral-950/70 px-3 py-2 text-xs text-zinc-200 font-mono"
              value={previewText}
            />
          </FormField>
        </Card>
      </section>
    </main>
  );
}
