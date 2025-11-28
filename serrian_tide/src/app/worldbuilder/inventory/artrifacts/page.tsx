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

// how the item is used, from the builder's perspective
type UsageType = "consumable" | "charges" | "at_will" | "other";
type RechargeWindow = "none" | "scene" | "session" | "rest" | "day" | "custom";

type ItemHookTrigger = "on_use" | "on_equip" | "passive" | "other";
type ItemHookTarget = "self" | "ally" | "enemy" | "area" | "other";
type ItemHookKind = "heal" | "damage" | "buff" | "debuff" | "utility" | "other";

type ItemHook = {
  id: string;
  trigger: ItemHookTrigger;
  target: ItemHookTarget;
  kind: ItemHookKind;
  amount?: number | null;
  label: string; // plain effect text (e.g. "Restore 5 HP")
};

export type ArtifactRow = {
  id: string | number;
  name: string;

  is_free?: boolean;
  createdBy?: string;

  timeline_tag?: string | null;
  cost_credits?: number | null;

  category?: string | null; // weapon, armor, wondrous, etc
  rarity?: string | null;
  attunement?: string | null;

  genre_tags?: string | null;
  mechanical_effect?: string | null;
  curse?: string | null;
  origin_lore?: string | null;
  weight?: number | null;
  narrative_notes?: string | null;

  // usage & structured effects (site-side only for now)
  usage_type?: UsageType | null;
  max_charges?: number | null;
  recharge_window?: RechargeWindow | null;
  recharge_notes?: string | null;
  effect_hooks?: ItemHook[] | null;

  shop_ready?: boolean;
  shop_role?: ShopRole;
};

const uid = () => Math.random().toString(36).slice(2, 10);
const nv = (x: unknown) =>
  x === null || x === undefined || x === "" ? "—" : String(x);

const GENRE_PRESETS = [
  "mythic",
  "relic",
  "eldritch",
  "divine",
  "infernal",
  "void",
  "artifact",
] as const;

/* ---------- main page ---------- */

export default function InventoryArtifactsPage() {
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

  const [artifacts, setArtifacts] = useState<ArtifactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [qtext, setQtext] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: string;
  } | null>(null);
  const [hooksByItem, setHooksByItem] = useState<Record<string, ItemHook[]>>(
    {}
  );

  useEffect(() => {
    async function loadArtifacts() {
      try {
        const userRes = await fetch("/api/profile/me");
        const userData = await userRes.json();
        if (userData.ok && userData.user) {
          setCurrentUser({ id: userData.user.id, role: userData.user.role });
        }

        const res = await fetch("/api/worldbuilder/inventory/artifacts");
        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error || "Failed to load artifacts");
        }

        const mapped: ArtifactRow[] = (data.artifacts || []).map((a: any) => ({
          ...a,
          is_free: a.isFree,
          shop_ready: a.shopReady,
          shop_role: a.shopRole ?? null,

          // usage / charges (future DB fields, safe to be undefined for now)
          usage_type: a.usageType ?? a.usage_type ?? null,
          max_charges: a.maxCharges ?? a.max_charges ?? null,
          recharge_window: a.rechargeWindow ?? a.recharge_window ?? null,
          recharge_notes: a.rechargeNotes ?? a.recharge_notes ?? null,

          // structured hooks (when you start persisting them)
          effect_hooks: a.effectHooks ?? a.effect_hooks ?? null,
        }));

        setArtifacts(mapped);

        // seed local hooks from any effect_hooks that might exist later
        const initialHooks: Record<string, ItemHook[]> = {};
        for (const row of mapped) {
          if (row.effect_hooks && row.effect_hooks.length > 0) {
            initialHooks[String(row.id)] = row.effect_hooks;
          }
        }
        setHooksByItem(initialHooks);
        if (mapped.length > 0 && mapped[0]) {
          setSelectedId(String(mapped[0].id));
        }
      } catch (err) {
        console.error("Error loading artifacts:", err);
        alert(
          `Failed to load artifacts: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    }

    loadArtifacts();
  }, []);

  const filteredArtifacts = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    if (!q) return artifacts;
    return artifacts.filter((r) => {
      const base = [
        r.name,
        r.category ?? "",
        r.rarity ?? "",
        r.genre_tags ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return base.includes(q);
    });
  }, [artifacts, qtext]);

  const selected: ArtifactRow | null = useMemo(
    () =>
      filteredArtifacts.find((r) => String(r.id) === String(selectedId ?? "")) ??
      null,
    [filteredArtifacts, selectedId]
  );

  useEffect(() => {
    if (!filteredArtifacts.length) {
      setSelectedId(null);
      return;
    }
    if (!selected && filteredArtifacts[0]) {
      setSelectedId(String(filteredArtifacts[0].id));
    }
  }, [filteredArtifacts, selected]);

  /* ---------- helpers ---------- */

  function createArtifact() {
    const id = uid();
    const row: ArtifactRow = {
      id,
      name: "New Artifact",
      is_free: false,
      shop_ready: false,
      shop_role: "exclusive",
      timeline_tag: null,
      cost_credits: null,
      category: "",
      rarity: "",
      attunement: "",
      genre_tags: "",
      mechanical_effect: "",
      curse: "",
      origin_lore: "",
      weight: null,
      narrative_notes: "",
    };
    setArtifacts((prev) => [row, ...prev]);
    setSelectedId(id);
  }

  async function deleteSelected() {
    if (!selected || !currentUser) return;
    const idStr = String(selected.id);

    const isNew = typeof selected.id === "string" && selected.id.length < 20;
    const isAdmin = currentUser.role?.toLowerCase() === "admin";
    const isCreator = selected.createdBy === currentUser.id;

    if (!isNew && !isAdmin && !isCreator) {
      alert("You can only delete artifacts you created (admins can delete any).");
      return;
    }

    if (!confirm("Delete this artifact from the inventory?")) return;

    const removeFromState = () => {
      setArtifacts((prev) => prev.filter((r) => String(r.id) !== idStr));
    };

    if (isNew) {
      removeFromState();
      setSelectedId(null);
      return;
    }

    try {
      const res = await fetch(
        `/api/worldbuilder/inventory/artifacts/${selected.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to delete artifact");
      }
      removeFromState();
      setSelectedId(null);
      alert("Artifact deleted.");
    } catch (err) {
      console.error("Error deleting artifact:", err);
      alert(
        `Failed to delete artifact: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }

  function renameSelected(newName: string) {
    if (!selected) return;
    const idStr = String(selected.id);
    setArtifacts((prev) =>
      prev.map((r) => (String(r.id) === idStr ? { ...r, name: newName } : r))
    );
  }

  function updateSelected(patch: Partial<ArtifactRow>) {
    if (!selected) return;
    const idStr = String(selected.id);
    setArtifacts((prev) =>
      prev.map((r) =>
        String(r.id) === idStr ? ({ ...r, ...patch } as ArtifactRow) : r
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
        shopReady: selected.shop_ready ?? false,
        shopRole: selected.shop_role ?? "exclusive",
        timelineTag: selected.timeline_tag ?? null,
        costCredits: selected.cost_credits ?? null,
        category: selected.category ?? null,
        rarity: selected.rarity ?? null,
        attunement: selected.attunement ?? null,
        genreTags: selected.genre_tags ?? null,
        mechanicalEffect: selected.mechanical_effect ?? null,
        curse: selected.curse ?? null,
        originLore: selected.origin_lore ?? null,
        weight: selected.weight ?? null,
        narrativeNotes: selected.narrative_notes ?? null,
        usageType: selected.usage_type ?? null,
        maxCharges: selected.max_charges ?? null,
        rechargeWindow: selected.recharge_window ?? null,
        rechargeNotes: selected.recharge_notes ?? null,
        effectHooks: currentHooks.length > 0 ? currentHooks : null,
      };

      let res;
      if (isNew) {
        res = await fetch("/api/worldbuilder/inventory/artifacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(
          `/api/worldbuilder/inventory/artifacts/${selected.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to save artifact");
      }

      if (isNew) {
        const oldId = selected.id;
        const saved = data.artifact;
        if (saved) {
          const transformed: ArtifactRow = {
            ...saved,
            is_free: saved.isFree,
            shop_ready: saved.shopReady,
            shop_role: saved.shopRole ?? null,
          };
          setArtifacts((prev) =>
            prev.map((r) =>
              String(r.id) === String(oldId) ? transformed : r
            )
          );
          setSelectedId(String(saved.id));
        }
      }

      alert("Artifact saved.");
    } catch (err) {
      console.error("Error saving artifact:", err);
      alert(
        `Failed to save artifact: ${
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

  function addHook() {
    if (!selected) return;
    const idStr = String(selected.id);
    const newHook: ItemHook = {
      id: uid(),
      trigger: "on_equip",
      target: "self",
      kind: "buff",
      amount: null,
      label: "",
    };
    setHooksByItem((prev) => ({
      ...prev,
      [idStr]: [...(prev[idStr] ?? []), newHook],
    }));
  }

  function updateHook(hookId: string, patch: Partial<ItemHook>) {
    if (!selected) return;
    const idStr = String(selected.id);
    setHooksByItem((prev) => ({
      ...prev,
      [idStr]: (prev[idStr] ?? []).map((h) =>
        h.id === hookId ? { ...h, ...patch } : h
      ),
    }));
  }

  function removeHook(hookId: string) {
    if (!selected) return;
    const idStr = String(selected.id);
    setHooksByItem((prev) => ({
      ...prev,
      [idStr]: (prev[idStr] ?? []).filter((h) => h.id !== hookId),
    }));
  }

  const currentHooks = useMemo(() => {
    if (!selected) return [];
    return hooksByItem[String(selected.id)] ?? [];
  }, [selected, hooksByItem]);

  const previewText = useMemo(() => {
    if (!selected) return "";
    const a = selected;
    const lines: string[] = [];

    lines.push(`Artifact: ${a.name}`);
    lines.push(
      `Rarity: ${nv(a.rarity)}   Category: ${nv(a.category)}   Attunement: ${nv(
        a.attunement
      )}`
    );
    lines.push(
      `Timeline: ${nv(a.timeline_tag)}   Cost: ${nv(a.cost_credits)}   Weight: ${nv(
        a.weight
      )}`
    );
    lines.push(`Tags: ${nv(a.genre_tags)}`);

    // usage summary
    if (a.usage_type) {
      lines.push("");
      let usageLine = "Usage: ";
      if (a.usage_type === "consumable") {
        usageLine += "Consumable (one use)";
      } else if (a.usage_type === "charges") {
        usageLine += `Charges: ${nv(a.max_charges)} (${nv(
          a.recharge_window
        )})`;
      } else if (a.usage_type === "at_will") {
        usageLine += "At-will";
      } else {
        usageLine += "Custom";
      }
      lines.push(usageLine);
      if (a.recharge_notes) {
        lines.push(`  Recharge: ${a.recharge_notes}`);
      }
    }

    lines.push("");
    lines.push(`Effect: ${nv(a.mechanical_effect)}`);

    if (currentHooks.length > 0) {
      lines.push("");
      lines.push("System Hooks:");
      currentHooks.forEach((h, idx) => {
        let kindPart: string = h.kind;
        if (h.kind !== "other" && h.amount != null) {
          kindPart = `${h.kind} ${h.amount}`;
        }
        lines.push(
          `  ${idx + 1}. [${h.trigger} → ${h.target} → ${kindPart}] ${
            h.label || "(no text)"
          }`
        );
      });
    }
    if (a.curse) {
      lines.push("");
      lines.push(`Curse / Drawbacks: ${a.curse}`);
    }
    if (a.origin_lore) {
      lines.push("");
      lines.push("Origin Lore:");
      lines.push(a.origin_lore);
    }
    if (a.narrative_notes) {
      lines.push("");
      lines.push("Notes:");
      lines.push(a.narrative_notes);
    }

    return lines.join("\n");
  }, [selected, currentHooks]);

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
              Artifacts &amp; Relics Builder
            </GradientText>
            <p className="mt-2 text-sm text-zinc-300/90 max-w-2xl">
              Wondrous items that shape legends: enchanted rings, cursed tomes,
              divine relics, and mystical focuses. For legendary weapons/armor,
              use the Weapons or Armor builders with rarity settings.
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
            <li>Use the library on the left to search and select artifacts.</li>
            <li>
              Fill out rarity, attunement, effects, and curses in the editor.
            </li>
            <li>
              Use the preview on the right when you drop the artifact into
              worlds, eras, and campaign modules.
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
              Artifacts Library
            </h2>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={createArtifact}
            >
              + New Artifact
            </Button>
          </div>

          <Input
            value={qtext}
            onChange={(e) => setQtext(e.target.value)}
            placeholder="Search artifacts by name, rarity, or tags…"
          />

          <div className="mt-2 flex-1 min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 border-b border-white/10">
              <span>Artifacts: {filteredArtifacts.length}</span>
              <span className="uppercase tracking-wide text-[10px] text-zinc-500">
                Library
              </span>
            </div>

            <div className="max-h-[420px] overflow-auto">
              {loading ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">
                  Loading artifacts…
                </div>
              ) : filteredArtifacts.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">
                  No artifacts yet. Forge your first one.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-left text-zinc-400">
                    <tr>
                      <th className="px-3 py-1">Name</th>
                      <th className="px-3 py-1">Rarity</th>
                      <th className="px-3 py-1">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArtifacts.map((r) => {
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
                          <td className="px-3 py-1.5">{nv(r.rarity ?? "")}</td>
                          <td className="px-3 py-1.5">
                            {nv(r.category ?? "")}
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
                    label="Artifact Name"
                    htmlFor="artifact-name"
                    description="Name players and modules will see."
                  >
                    <Input
                      id="artifact-name"
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
                    Save Artifact
                  </Button>
                </div>
              </div>

              {/* rarity / category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Rarity"
                  htmlFor="artifact-rarity"
                  description="How hard this should be to obtain."
                >
                  <select
                    id="artifact-rarity"
                    className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={selected.rarity ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        rarity: e.target.value || null,
                      })
                    }
                  >
                    <option value="">(unset)</option>
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="very_rare">Very Rare</option>
                    <option value="legendary">Legendary</option>
                    <option value="mythic">Mythic</option>
                    <option value="unique">Unique</option>
                  </select>
                </FormField>

                <FormField
                  label="Category"
                  htmlFor="artifact-category"
                  description="Weapon, armor, relic, wondrous, etc."
                >
                  <select
                    id="artifact-category"
                    className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={selected.category ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        category: e.target.value || null,
                      })
                    }
                  >
                    <option value="">(unset)</option>
                    <option value="wondrous">Wondrous Item</option>
                    <option value="consumable">Consumable</option>
                    <option value="relic">Relic</option>
                    <option value="tome">Tome / Book</option>
                    <option value="focus">Focus / Conduit</option>
                    <option value="other">Other</option>
                  </select>
                </FormField>
              </div>

              {/* attunement */}
              <FormField
                label="Attunement"
                htmlFor="artifact-attunement"
                description="Requirements, costs, or limits for wielding this artifact."
              >
                <Input
                  id="artifact-attunement"
                  value={selected.attunement ?? ""}
                  onChange={(e) =>
                    updateSelected({
                      attunement: e.target.value,
                    })
                  }
                />
              </FormField>

              {/* timeline / cost */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label="Timeline Tag" htmlFor="artifact-timeline">
                  <Input
                    id="artifact-timeline"
                    value={selected.timeline_tag ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        timeline_tag: e.target.value,
                      })
                    }
                  />
                </FormField>
                <FormField label="Cost (Credits)" htmlFor="artifact-cost">
                  <Input
                    id="artifact-cost"
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

              {/* tags & weight */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Genre Tags"
                  htmlFor="artifact-tags"
                  description="Comma- or space-separated; use chips to append."
                >
                  <div className="space-y-2">
                    <Input
                      id="artifact-tags"
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

                <FormField label="Weight" htmlFor="artifact-weight">
                  <Input
                    id="artifact-weight"
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
              </div>

              {/* Usage / charges */}
              <FormField
                label="Usage / Charges"
                htmlFor="artifact-usage"
                description="For relics with limited uses, daily powers, or that consume themselves."
              >
                <div className="space-y-2">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {/* usage type */}
                    <select
                      className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-zinc-100"
                      value={selected.usage_type ?? "at_will"}
                      onChange={(e) =>
                        updateSelected({
                          usage_type: e.target.value as UsageType,
                        })
                      }
                    >
                      <option value="at_will">At-will (default)</option>
                      <option value="consumable">Consumable (one use)</option>
                      <option value="charges">Has charges</option>
                      <option value="other">Other / custom</option>
                    </select>

                    {/* max charges (only for 'charges') */}
                    {selected.usage_type === "charges" && (
                      <Input
                        type="number"
                        min={0}
                        placeholder="Max charges"
                        value={selected.max_charges ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            max_charges:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    )}

                    {/* recharge window (only for 'charges') */}
                    {selected.usage_type === "charges" && (
                      <select
                        className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-zinc-100"
                        value={selected.recharge_window ?? "none"}
                        onChange={(e) =>
                          updateSelected({
                            recharge_window: e.target.value as RechargeWindow,
                          })
                        }
                      >
                        <option value="none">Does not recharge</option>
                        <option value="scene">Per scene</option>
                        <option value="session">Per session</option>
                        <option value="rest">Per rest</option>
                        <option value="day">Per day</option>
                        <option value="custom">Custom</option>
                      </select>
                    )}
                  </div>

                  {/* recharge notes, if custom */}
                  {selected.usage_type === "charges" &&
                    selected.recharge_window === "custom" && (
                      <textarea
                        className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-xs text-zinc-100"
                        placeholder='Describe how this recharges (e.g. "regains 1 charge under moonlight").'
                        value={selected.recharge_notes ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            recharge_notes: e.target.value,
                          })
                        }
                      />
                    )}
                </div>
              </FormField>

              {/* mechanical effect */}
              <FormField
                label="Mechanical Effect"
                htmlFor="artifact-effect"
                description="How this relic behaves at the table."
              >
                <textarea
                  id="artifact-effect"
                  className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                  value={selected.mechanical_effect ?? ""}
                  onChange={(e) =>
                    updateSelected({
                      mechanical_effect: e.target.value,
                    })
                  }
                />
              </FormField>

              {/* curse */}
              <FormField
                label="Curse / Drawbacks"
                htmlFor="artifact-curse"
                description="Side effects, madness, corruption, oaths, or obligations."
              >
                <textarea
                  id="artifact-curse"
                  className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                  value={selected.curse ?? ""}
                  onChange={(e) =>
                    updateSelected({
                      curse: e.target.value,
                    })
                  }
                />
              </FormField>

              {/* origin & notes */}
              <FormField
                label="Origin Lore"
                htmlFor="artifact-origin"
                description="Who forged this, where it came from, why the cosmos cares."
              >
                <textarea
                  id="artifact-origin"
                  className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                  value={selected.origin_lore ?? ""}
                  onChange={(e) =>
                    updateSelected({
                      origin_lore: e.target.value,
                    })
                  }
                />
              </FormField>

              <FormField
                label="Narrative Notes"
                htmlFor="artifact-notes"
                description="GM guidance, role in prophecy, or how it should feel in play."
              >
                <textarea
                  id="artifact-notes"
                  className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                  value={selected.narrative_notes ?? ""}
                  onChange={(e) =>
                    updateSelected({
                      narrative_notes: e.target.value,
                    })
                  }
                />
              </FormField>

              {/* system hooks */}
              <FormField
                label="System Hooks"
                htmlFor="artifact-hooks"
                description="Structured effects for future automation: legendary powers, attunement benefits, auras, etc."
              >
                <div className="space-y-2">
                  {currentHooks.map((hook) => (
                    <div
                      key={hook.id}
                      className="rounded-2xl border border-emerald-400/30 bg-emerald-500/5 px-3 py-2 flex flex-col gap-2"
                    >
                      <div className="flex flex-wrap gap-2">
                        {/* trigger */}
                        <select
                          className="rounded-lg border border-emerald-400/40 bg-black/30 px-2 py-1 text-[11px] text-emerald-50"
                          value={hook.trigger}
                          onChange={(e) =>
                            updateHook(hook.id, {
                              trigger: e.target.value as ItemHookTrigger,
                            })
                          }
                        >
                          <option value="on_use">on_use</option>
                          <option value="on_equip">on_equip</option>
                          <option value="passive">passive</option>
                          <option value="other">other</option>
                        </select>

                        {/* target */}
                        <select
                          className="rounded-lg border border-emerald-400/40 bg-black/30 px-2 py-1 text-[11px] text-emerald-50"
                          value={hook.target}
                          onChange={(e) =>
                            updateHook(hook.id, {
                              target: e.target.value as ItemHookTarget,
                            })
                          }
                        >
                          <option value="self">self</option>
                          <option value="ally">ally</option>
                          <option value="enemy">enemy</option>
                          <option value="area">area</option>
                          <option value="other">other</option>
                        </select>

                        {/* kind */}
                        <select
                          className="rounded-lg border border-emerald-400/40 bg-black/30 px-2 py-1 text-[11px] text-emerald-50"
                          value={hook.kind}
                          onChange={(e) =>
                            updateHook(hook.id, {
                              kind: e.target.value as ItemHookKind,
                            })
                          }
                        >
                          <option value="heal">heal</option>
                          <option value="damage">damage</option>
                          <option value="buff">buff</option>
                          <option value="debuff">debuff</option>
                          <option value="utility">utility</option>
                          <option value="other">other</option>
                        </select>

                        {/* amount (optional) */}
                        <Input
                          type="number"
                          className="w-20 text-[11px]"
                          placeholder="amt"
                          value={hook.amount ?? ""}
                          onChange={(e) =>
                            updateHook(hook.id, {
                              amount:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                        />
                      </div>

                      {/* label / description */}
                      <Input
                        className="w-full text-[11px]"
                        placeholder='e.g. "Aura: grant +2 to all saves within 30ft" or "1/day: resurrect fallen ally"'
                        value={hook.label}
                        onChange={(e) =>
                          updateHook(hook.id, { label: e.target.value })
                        }
                      />

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-[11px] text-emerald-200/80 hover:text-emerald-50"
                          onClick={() => removeHook(hook.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addHook}
                  >
                    + Add Hook
                  </Button>
                </div>
              </FormField>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">
              No artifact selected. Create or select one from the library.
            </p>
          )}
        </Card>

        {/* RIGHT: preview */}
        <Card className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-4 shadow-xl">
          <FormField
            label="Artifact Preview"
            htmlFor="artifact-preview"
            description="Copy-paste ready block for sheets, handouts, and modules."
          >
            <textarea
              id="artifact-preview"
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
