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

export type ArmorRow = {
  id: string | number;
  name: string;

  is_free?: boolean;
  createdBy?: string;

  timeline_tag?: string | null;
  cost_credits?: number | null;

  area_covered?: string | null;
  soak?: number | null;
  category?: string | null;
  atype?: string | null;

  genre_tags?: string | null;
  weight?: number | null;
  encumbrance_penalty?: number | null;
  effect?: string | null;
  narrative_notes?: string | null;

  shop_ready?: boolean;
  shop_role?: ShopRole;
};

const uid = () => Math.random().toString(36).slice(2, 10);
const nv = (x: unknown) =>
  x === null || x === undefined || x === "" ? "—" : String(x);

const GENRE_PRESETS = [
  "fantasy",
  "dark_fantasy",
  "sci_fi",
  "cyberpunk",
  "post_apoc",
  "steampunk",
  "modern",
] as const;

/* ---------- main page ---------- */

export default function InventoryArmorPage() {
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

  const [armor, setArmor] = useState<ArmorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [qtext, setQtext] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    async function loadArmor() {
      try {
        const userRes = await fetch("/api/profile/me");
        const userData = await userRes.json();
        if (userData.ok && userData.user) {
          setCurrentUser({ id: userData.user.id, role: userData.user.role });
        }

        const res = await fetch("/api/worldbuilder/inventory/armor");
        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error || "Failed to load armor");
        }

        const mapped: ArmorRow[] = (data.armor || []).map((a: any) => ({
          ...a,
          is_free: a.isFree,
          shop_ready: a.shopReady,
          shop_role: a.shopRole ?? null,
        }));

        setArmor(mapped);
        if (mapped.length > 0 && mapped[0]) {
          setSelectedId(String(mapped[0].id));
        }
      } catch (err) {
        console.error("Error loading armor:", err);
        alert(
          `Failed to load armor: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    }

    loadArmor();
  }, []);

  const filteredArmor = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    if (!q) return armor;
    return armor.filter((r) => {
      const base = [
        r.name,
        r.category ?? "",
        r.area_covered ?? "",
        r.genre_tags ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return base.includes(q);
    });
  }, [armor, qtext]);

  const selected: ArmorRow | null = useMemo(
    () =>
      filteredArmor.find((r) => String(r.id) === String(selectedId ?? "")) ??
      null,
    [filteredArmor, selectedId]
  );

  useEffect(() => {
    if (!filteredArmor.length) {
      setSelectedId(null);
      return;
    }
    if (!selected && filteredArmor[0]) {
      setSelectedId(String(filteredArmor[0].id));
    }
  }, [filteredArmor, selected]);

  /* ---------- helpers ---------- */

  function createArmor() {
    const id = uid();
    const row: ArmorRow = {
      id,
      name: "New Armor",
      is_free: false,
      shop_ready: true,
      shop_role: "shop_stock",
      timeline_tag: null,
      cost_credits: null,
      area_covered: "",
      soak: null,
      category: "light",
      atype: "mundane",
      genre_tags: "",
      weight: null,
      encumbrance_penalty: null,
      effect: "",
      narrative_notes: "",
    };
    setArmor((prev) => [row, ...prev]);
    setSelectedId(id);
  }

  async function deleteSelected() {
    if (!selected || !currentUser) return;
    const idStr = String(selected.id);

    const isNew = typeof selected.id === "string" && selected.id.length < 20;
    const isAdmin = currentUser.role?.toLowerCase() === "admin";
    const isCreator = selected.createdBy === currentUser.id;

    if (!isNew && !isAdmin && !isCreator) {
      alert("You can only delete armor you created (admins can delete any).");
      return;
    }

    if (!confirm("Delete this armor from the inventory?")) return;

    const removeFromState = () => {
      setArmor((prev) => prev.filter((r) => String(r.id) !== idStr));
    };

    if (isNew) {
      removeFromState();
      setSelectedId(null);
      return;
    }

    try {
      const res = await fetch(
        `/api/worldbuilder/inventory/armor/${selected.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to delete armor");
      }
      removeFromState();
      setSelectedId(null);
      alert("Armor deleted.");
    } catch (err) {
      console.error("Error deleting armor:", err);
      alert(
        `Failed to delete armor: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }

  function renameSelected(newName: string) {
    if (!selected) return;
    const idStr = String(selected.id);
    setArmor((prev) =>
      prev.map((r) => (String(r.id) === idStr ? { ...r, name: newName } : r))
    );
  }

  function updateSelected(patch: Partial<ArmorRow>) {
    if (!selected) return;
    const idStr = String(selected.id);
    setArmor((prev) =>
      prev.map((r) =>
        String(r.id) === idStr ? ({ ...r, ...patch } as ArmorRow) : r
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
        shopReady: true,
        shopRole: "shop_stock",
        timelineTag: selected.timeline_tag ?? null,
        costCredits: selected.cost_credits ?? null,
        areaCovered: selected.area_covered ?? null,
        soak: selected.soak ?? null,
        category: selected.category ?? null,
        atype: selected.atype ?? null,
        genreTags: selected.genre_tags ?? null,
        weight: selected.weight ?? null,
        encumbrancePenalty: selected.encumbrance_penalty ?? null,
        effect: selected.effect ?? null,
        narrativeNotes: selected.narrative_notes ?? null,
      };

      let res;
      if (isNew) {
        res = await fetch("/api/worldbuilder/inventory/armor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(
          `/api/worldbuilder/inventory/armor/${selected.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to save armor");
      }

      if (isNew) {
        const oldId = selected.id;
        const saved = data.armor;
        if (saved) {
          const transformed: ArmorRow = {
            ...saved,
            is_free: saved.isFree,
            shop_ready: saved.shopReady,
            shop_role: saved.shopRole ?? null,
          };
          setArmor((prev) =>
            prev.map((r) =>
              String(r.id) === String(oldId) ? transformed : r
            )
          );
          setSelectedId(String(saved.id));
        }
      }

      alert("Armor saved.");
    } catch (err) {
      console.error("Error saving armor:", err);
      alert(
        `Failed to save armor: ${
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
    const a = selected;
    const lines: string[] = [];

    lines.push(`Armor: ${a.name}`);
    lines.push(
      `Timeline: ${nv(a.timeline_tag)}   Cost: ${nv(a.cost_credits)}`
    );
    lines.push(
      `Area Covered: ${nv(a.area_covered)}   Soak: ${nv(a.soak)}`
    );
    lines.push(
      `Category: ${nv(a.category)}   Type: ${nv(a.atype)}   Weight: ${nv(
        a.weight
      )}   Encumbrance: ${nv(a.encumbrance_penalty)}`
    );
    lines.push(`Tags: ${nv(a.genre_tags)}`);
    lines.push("");
    lines.push(`Effect: ${nv(a.effect)}`);

    if (a.narrative_notes) {
      lines.push("");
      lines.push("Notes:");
      lines.push(a.narrative_notes);
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
              Armor &amp; Protection Builder
            </GradientText>
            <p className="mt-2 text-sm text-zinc-300/90 max-w-2xl">
              Suits, shields, exoskeletons, environmental gear—anything that
              soaks, redirects, or ignores harm. This window shapes how hard
              your worlds hit and how long heroes survive.
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
              Use the library on the left to search and select armor pieces.
            </li>
            <li>
              Edit coverage, soak, weight, and encumbrance in the center
              editor.
            </li>
            <li>
              Use the preview on the right as the text block for sheets and
              statblocks.
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
              Armor Library
            </h2>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={createArmor}
            >
              + New Armor
            </Button>
          </div>

          <Input
            value={qtext}
            onChange={(e) => setQtext(e.target.value)}
            placeholder="Search armor by name, area, or tags…"
          />

          <div className="mt-2 flex-1 min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 border-b border-white/10">
              <span>Armor pieces: {filteredArmor.length}</span>
              <span className="uppercase tracking-wide text-[10px] text-zinc-500">
                Library
              </span>
            </div>

            <div className="max-h-[420px] overflow-auto">
              {loading ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">
                  Loading armor…
                </div>
              ) : filteredArmor.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">
                  No armor yet. Create your first piece.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-left text-zinc-400">
                    <tr>
                      <th className="px-3 py-1">Name</th>
                      <th className="px-3 py-1">Area</th>
                      <th className="px-3 py-1">Soak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArmor.map((r) => {
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
                          <td className="px-3 py-1.5">
                            {nv(r.area_covered ?? "")}
                          </td>
                          <td className="px-3 py-1.5">
                            {nv(r.soak ?? "")}
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
                    label="Armor Name"
                    htmlFor="armor-name"
                    description="Label for sheets and statblocks."
                  >
                    <Input
                      id="armor-name"
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
                    Save Armor
                  </Button>
                </div>
              </div>

              {/* coverage & soak */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Area Covered"
                  htmlFor="armor-area"
                  description="Chest, full-body, head, arms, etc."
                >
                  <Input
                    id="armor-area"
                    value={selected.area_covered ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        area_covered: e.target.value,
                      })
                    }
                  />
                </FormField>
                <FormField
                  label="Soak"
                  htmlFor="armor-soak"
                  description="Numeric soak / reduction value."
                >
                  <Input
                    id="armor-soak"
                    type="number"
                    value={selected.soak ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        soak:
                          e.target.value === ""
                            ? null
                            : Number(e.target.value),
                      })
                    }
                  />
                </FormField>
              </div>

              {/* category & type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Category"
                  htmlFor="armor-category"
                  description="Used by proficiency and load rules."
                >
                  <select
                    id="armor-category"
                    className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={selected.category ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        category: e.target.value || null,
                      })
                    }
                  >
                    <option value="">(unset)</option>
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="heavy">Heavy</option>
                    <option value="shield">Shield</option>
                    <option value="environmental">Environmental</option>
                    <option value="exoskeleton">Exoskeleton</option>
                    <option value="other">Other</option>
                  </select>
                </FormField>

                <FormField
                  label="Armor Type"
                  htmlFor="armor-type"
                  description="Mundane, magic, artifact, tech, etc."
                >
                  <select
                    id="armor-type"
                    className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={selected.atype ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        atype: e.target.value || null,
                      })
                    }
                  >
                    <option value="">(unset)</option>
                    <option value="natural">Natural</option>
                    <option value="mundane">Mundane</option>
                    <option value="magic">Magic</option>
                    <option value="artifact">Artifact</option>
                    <option value="tech">Tech</option>
                    <option value="other">Other</option>
                  </select>
                </FormField>
              </div>

              {/* timeline / cost */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label="Timeline Tag" htmlFor="armor-timeline">
                  <Input
                    id="armor-timeline"
                    value={selected.timeline_tag ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        timeline_tag: e.target.value,
                      })
                    }
                  />
                </FormField>
                <FormField label="Cost (Credits)" htmlFor="armor-cost">
                  <Input
                    id="armor-cost"
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

              {/* weight & encumbrance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label="Weight" htmlFor="armor-weight">
                  <Input
                    id="armor-weight"
                    type="number"
                    value={selected.weight ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        weight:
                          e.target.value === ""
                            ? null
                            : Number(e.target.value),
                      })
                    }
                  />
                </FormField>
                <FormField
                  label="Encumbrance Penalty"
                  htmlFor="armor-enc"
                  description="Penalty applied to checks or movement."
                >
                  <Input
                    id="armor-enc"
                    type="number"
                    value={selected.encumbrance_penalty ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        encumbrance_penalty:
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
                htmlFor="armor-tags"
                description="Comma- or space-separated; use chips to append."
              >
                <div className="space-y-2">
                  <Input
                    id="armor-tags"
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

              {/* effect & notes */}
              <FormField
                label="Mechanical Effect"
                htmlFor="armor-effect"
                description="How this armor interacts with attacks, damage types, and conditions."
              >
                <textarea
                  id="armor-effect"
                  className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                  value={selected.effect ?? ""}
                  onChange={(e) =>
                    updateSelected({
                      effect: e.target.value,
                    })
                  }
                />
              </FormField>

              <FormField
                label="Narrative Notes"
                htmlFor="armor-notes"
                description="How it looks, sounds, and feels; who forges or wears it."
              >
                <textarea
                  id="armor-notes"
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
              No armor selected. Create or select one from the library.
            </p>
          )}
        </Card>

        {/* RIGHT: preview */}
        <Card className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-4 shadow-xl">
          <FormField
            label="Armor Preview"
            htmlFor="armor-preview"
            description="Copy-paste ready block for sheets, statblocks, and modules."
          >
            <textarea
              id="armor-preview"
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
