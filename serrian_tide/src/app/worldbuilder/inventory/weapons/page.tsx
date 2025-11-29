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
import { InventoryNav } from "@/components/worldbuilder/InventoryNav";

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

export type WeaponRow = {
  id: string | number;
  name: string;

  is_free?: boolean;
  createdBy?: string;

  timeline_tag?: string | null;
  cost_credits?: number | null;
  durability?: number | null;

  category?: string | null;
  handedness?: string | null;

  dtype?: string | null;
  range_type?: string | null;
  range_text?: string | null;

  genre_tags?: string | null;
  weight?: number | null;
  damage?: number | null;
  effect?: string | null;
  narrative_notes?: string | null;

  // legendary item properties
  rarity?: string | null;
  attunement?: string | null;
  curse?: string | null;

  // usage & structured effects (site-side only for now)
  usage_type?: UsageType | null;
  max_charges?: number | null;
  recharge_window?: RechargeWindow | null;
  recharge_notes?: string | null;
  effect_hooks?: ItemHook[] | null;

  // in DB but no explicit UI for these
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

export default function InventoryWeaponsPage() {
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

  const [weapons, setWeapons] = useState<WeaponRow[]>([]);
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

  // load user + weapons
  useEffect(() => {
    async function loadWeapons() {
      try {
        const userRes = await fetch("/api/profile/me");
        const userData = await userRes.json();
        if (userData.ok && userData.user) {
          setCurrentUser({ id: userData.user.id, role: userData.user.role });
        }

        const res = await fetch("/api/worldbuilder/inventory/weapons");
        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error || "Failed to load weapons");
        }

        const mapped: WeaponRow[] = (data.weapons || []).map((w: any) => ({
          ...w,
          is_free: w.isFree,
          shop_ready: w.shopReady,
          shop_role: w.shopRole ?? null,

          // usage / charges (future DB fields, safe to be undefined for now)
          usage_type: w.usageType ?? w.usage_type ?? null,
          max_charges: w.maxCharges ?? w.max_charges ?? null,
          recharge_window: w.rechargeWindow ?? w.recharge_window ?? null,
          recharge_notes: w.rechargeNotes ?? w.recharge_notes ?? null,

          // structured hooks (when you start persisting them)
          effect_hooks: w.effectHooks ?? w.effect_hooks ?? null,
        }));

        setWeapons(mapped);

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
        console.error("Error loading weapons:", err);
        alert(
          `Failed to load weapons: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    }

    loadWeapons();
  }, []);

  const filteredWeapons = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    if (!q) return weapons;
    return weapons.filter((r) => {
      const base = [
        r.name,
        r.category ?? "",
        r.dtype ?? "",
        r.genre_tags ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return base.includes(q);
    });
  }, [weapons, qtext]);

  const selected: WeaponRow | null = useMemo(
    () =>
      filteredWeapons.find((r) => String(r.id) === String(selectedId ?? "")) ??
      null,
    [filteredWeapons, selectedId]
  );

  useEffect(() => {
    if (!filteredWeapons.length) {
      setSelectedId(null);
      return;
    }
    if (!selected && filteredWeapons[0]) {
      setSelectedId(String(filteredWeapons[0].id));
    }
  }, [filteredWeapons, selected]);

  /* ---------- helpers ---------- */

  function createWeapon() {
    const id = uid();
    const weapon: WeaponRow = {
      id,
      name: "New Weapon",
      is_free: false,
      shop_ready: true,
      shop_role: "shop_stock",
      timeline_tag: null,
      cost_credits: null,
      category: "melee",
      handedness: null,
      dtype: null,
      range_type: null,
      range_text: null,
      genre_tags: "",
      weight: null,
      damage: null,
      effect: "",
      narrative_notes: "",
      rarity: null,
      attunement: null,
      curse: null,
    };
    setWeapons((prev) => [weapon, ...prev]);
    setSelectedId(id);
  }

  async function deleteSelected() {
    if (!selected || !currentUser) return;
    const idStr = String(selected.id);

    const isNew = typeof selected.id === "string" && selected.id.length < 20;
    const isAdmin = currentUser.role?.toLowerCase() === "admin";
    const isCreator = selected.createdBy === currentUser.id;

    if (!isNew && !isAdmin && !isCreator) {
      alert("You can only delete weapons you created (admins can delete any).");
      return;
    }

    if (!confirm("Delete this weapon from the inventory?")) return;

    const removeFromState = () => {
      setWeapons((prev) => prev.filter((r) => String(r.id) !== idStr));
    };

    if (isNew) {
      removeFromState();
      setSelectedId(null);
      return;
    }

    try {
      const res = await fetch(
        `/api/worldbuilder/inventory/weapons/${selected.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to delete weapon");
      }
      removeFromState();
      setSelectedId(null);
      alert("Weapon deleted.");
    } catch (err) {
      console.error("Error deleting weapon:", err);
      alert(
        `Failed to delete weapon: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }

  function renameSelected(newName: string) {
    if (!selected) return;
    const idStr = String(selected.id);
    setWeapons((prev) =>
      prev.map((r) => (String(r.id) === idStr ? { ...r, name: newName } : r))
    );
  }

  function updateSelected(patch: Partial<WeaponRow>) {
    if (!selected) return;
    const idStr = String(selected.id);
    setWeapons((prev) =>
      prev.map((r) =>
        String(r.id) === idStr ? ({ ...r, ...patch } as WeaponRow) : r
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
        category: selected.category ?? null,
        handedness: selected.handedness ?? null,
        dtype: selected.dtype ?? null,
        rangeType: selected.range_type ?? null,
        rangeText: selected.range_text ?? null,
        genreTags: selected.genre_tags ?? null,
        weight: selected.weight ?? null,
        damage: selected.damage ?? null,
        effect: selected.effect ?? null,
        narrativeNotes: selected.narrative_notes ?? null,
        rarity: selected.rarity ?? null,
        attunement: selected.attunement ?? null,
        curse: selected.curse ?? null,
        usageType: selected.usage_type ?? null,
        maxCharges: selected.max_charges ?? null,
        rechargeWindow: selected.recharge_window ?? null,
        rechargeNotes: selected.recharge_notes ?? null,
        effectHooks: currentHooks.length > 0 ? currentHooks : null,
      };

      let res;
      if (isNew) {
        res = await fetch("/api/worldbuilder/inventory/weapons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(
          `/api/worldbuilder/inventory/weapons/${selected.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to save weapon");
      }

      if (isNew) {
        const oldId = selected.id;
        const saved = data.weapon;
        if (saved) {
          const transformed: WeaponRow = {
            ...saved,
            is_free: saved.isFree,
            shop_ready: saved.shopReady,
            shop_role: saved.shopRole ?? null,
          };
          setWeapons((prev) =>
            prev.map((r) =>
              String(r.id) === String(oldId) ? transformed : r
            )
          );
          setSelectedId(String(saved.id));
        }
      }

      alert("Weapon saved.");
    } catch (err) {
      console.error("Error saving weapon:", err);
      alert(
        `Failed to save weapon: ${
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
      target: "enemy",
      kind: "damage",
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
    const w = selected;
    const lines: string[] = [];

    lines.push(`Weapon: ${w.name}`);
    lines.push(
      `Timeline: ${nv(w.timeline_tag)}   Cost: ${nv(w.cost_credits)}`
    );
    lines.push(
      `Category: ${nv(w.category)}   Handedness: ${nv(w.handedness)}`
    );
    lines.push(
      `Damage Type: ${nv(w.dtype)}   Damage: ${nv(w.damage)}   Range: ${nv(
        w.range_type
      )} (${nv(w.range_text)})`
    );
    lines.push(`Tags: ${nv(w.genre_tags)}   Weight: ${nv(w.weight)}`);

    // usage summary
    if (w.usage_type) {
      lines.push("");
      let usageLine = "Usage: ";
      if (w.usage_type === "consumable") {
        usageLine += "Consumable (one use)";
      } else if (w.usage_type === "charges") {
        usageLine += `Charges: ${nv(w.max_charges)} (${nv(
          w.recharge_window
        )})`;
      } else if (w.usage_type === "at_will") {
        usageLine += "At-will";
      } else {
        usageLine += "Custom";
      }
      lines.push(usageLine);
      if (w.recharge_notes) {
        lines.push(`  Recharge: ${w.recharge_notes}`);
      }
    }

    lines.push("");
    lines.push(`Effect: ${nv(w.effect)}`);

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

    if (w.narrative_notes) {
      lines.push("");
      lines.push("Notes:");
      lines.push(w.narrative_notes);
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
              Weapons Builder
            </GradientText>
            <p className="mt-2 text-sm text-zinc-300/90 max-w-2xl">
              Blades, guns, bows, relic weapons, and anything that deals damage
              or threatens violence. This window focuses on clean stat blocks
              you can reuse across creatures, NPCs, and player gear.
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <WBNav current="inventory" />
          <InventoryNav />
        </div>
      </header>

      {/* Quick help */}
      <section className="max-w-7xl mx-auto mb-4">
        <Card className="bg-white/5 border border-white/10 rounded-3xl p-4 shadow-lg">
          <h2 className="text-sm font-semibold text-zinc-200 mb-1">
            How this window works
          </h2>
          <ol className="list-decimal pl-5 text-xs text-zinc-300 space-y-1">
            <li>Use the library on the left to search and select weapons.</li>
            <li>
              Edit basics, damage profile, and tags in the center editor.
            </li>
            <li>
              Use the preview on the right as your copy-paste block for sheets
              and modules.
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
              Weapon Library
            </h2>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={createWeapon}
            >
              + New Weapon
            </Button>
          </div>

          <Input
            value={qtext}
            onChange={(e) => setQtext(e.target.value)}
            placeholder="Search weapons by name, category, or tags…"
          />

          <div className="mt-2 flex-1 min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 border-b border-white/10">
              <span>Weapons: {filteredWeapons.length}</span>
              <span className="uppercase tracking-wide text-[10px] text-zinc-500">
                Library
              </span>
            </div>

            <div className="max-h-[420px] overflow-auto">
              {loading ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">
                  Loading weapons…
                </div>
              ) : filteredWeapons.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">
                  No weapons yet. Create your first one.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-left text-zinc-400">
                    <tr>
                      <th className="px-3 py-1">Name</th>
                      <th className="px-3 py-1">Category</th>
                      <th className="px-3 py-1">Damage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWeapons.map((r) => {
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
                            {nv(r.category ?? "")}
                          </td>
                          <td className="px-3 py-1.5">
                            {nv(r.damage ?? "")}
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
                    label="Weapon Name"
                    htmlFor="weapon-name"
                    description="The label that will appear on sheets and stat blocks."
                  >
                    <Input
                      id="weapon-name"
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
                    Save Weapon
                  </Button>
                </div>
              </div>

              {/* basics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Category"
                  htmlFor="weapon-category"
                  description="High-level grouping for filters and shops."
                >
                  <select
                    id="weapon-category"
                    className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={selected.category ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        category: e.target.value || null,
                      })
                    }
                  >
                    <option value="">(unset)</option>
                    <option value="melee">Melee</option>
                    <option value="ranged">Ranged</option>
                    <option value="thrown">Thrown</option>
                    <option value="focus">Spell Focus Weapon</option>
                    <option value="improvised">Improvised</option>
                    <option value="other">Other</option>
                  </select>
                </FormField>

                <FormField
                  label="Handedness"
                  htmlFor="weapon-hand"
                  description="Used by encumbrance and fighting style rules."
                >
                  <select
                    id="weapon-hand"
                    className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={selected.handedness ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        handedness: e.target.value || null,
                      })
                    }
                  >
                    <option value="">(any)</option>
                    <option value="one-handed">One-handed</option>
                    <option value="two-handed">Two-handed</option>
                    <option value="versatile">Versatile</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label="Durability" htmlFor="weapon-durability" description="Weapon condition/health points">
                  <Input
                    id="weapon-durability"
                    type="number"
                    value={selected.durability ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        durability:
                          e.target.value === ""
                            ? null
                            : Number(e.target.value),
                      })
                    }
                  />
                </FormField>
                <FormField label="Cost (Credits)" htmlFor="weapon-cost">
                  <Input
                    id="weapon-cost"
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

              {/* damage + range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label="Damage Type" htmlFor="weapon-dtype">
                  <select
                    id="weapon-dtype"
                    className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={selected.dtype ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        dtype: e.target.value || null,
                      })
                    }
                  >
                    <option value="">(unset)</option>
                    <option value="slashing">Slashing</option>
                    <option value="piercing">Piercing</option>
                    <option value="bludgeoning">Bludgeoning</option>
                    <option value="fire">Fire</option>
                    <option value="cold">Cold</option>
                    <option value="acid">Acid</option>
                    <option value="lightning">Lightning</option>
                    <option value="psychic">Psychic</option>
                    <option value="radiant">Radiant</option>
                    <option value="necrotic">Necrotic</option>
                    <option value="force">Force</option>
                    <option value="other">Other</option>
                  </select>
                </FormField>

                <FormField label="Damage" htmlFor="weapon-damage">
                  <Input
                    id="weapon-damage"
                    type="number"
                    value={selected.damage ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        damage:
                          e.target.value === ""
                            ? null
                            : Number(e.target.value),
                      })
                    }
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label="Range Type" htmlFor="weapon-range-type">
                  <select
                    id="weapon-range-type"
                    className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={selected.range_type ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        range_type: e.target.value || null,
                      })
                    }
                  >
                    <option value="">(unset)</option>
                    <option value="melee">Melee</option>
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                    <option value="extreme">Extreme</option>
                    <option value="special">Special</option>
                  </select>
                </FormField>

                <FormField
                  label="Range Text"
                  htmlFor="weapon-range-text"
                  description="Optional specific bands (e.g., 30/120, or cone 15ft)."
                >
                  <Input
                    id="weapon-range-text"
                    value={selected.range_text ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        range_text: e.target.value,
                      })
                    }
                  />
                </FormField>
              </div>

              {/* tags + weight */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Weight"
                  htmlFor="weapon-weight"
                  description="Used by encumbrance and load systems."
                >
                  <Input
                    id="weapon-weight"
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
                  label="Genre Tags"
                  htmlFor="weapon-tags"
                  description="Comma- or space-separated; use chips to append."
                >
                  <div className="space-y-2">
                    <Input
                      id="weapon-tags"
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
              </div>

              {/* Usage / charges */}
              <FormField
                label="Usage / Charges"
                htmlFor="weapon-usage"
                description="For thrown weapons, magical weapons with charges, or one-use explosives."
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
                        placeholder='Describe how this recharges (e.g. "regains 1 charge for every 10 Mana spent").'
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

              <FormField
                label="Mechanical Effect"
                htmlFor="weapon-effect"
                description="Crit riders, status effects, reload rules, or any special interaction."
              >
                <textarea
                  id="weapon-effect"
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
                htmlFor="weapon-notes"
                description="How it looks, sounds, and feels in the fiction."
              >
                <textarea
                  id="weapon-notes"
                  className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                  value={selected.narrative_notes ?? ""}
                  onChange={(e) =>
                    updateSelected({
                      narrative_notes: e.target.value,
                    })
                  }
                />
              </FormField>

              {/* Legendary Properties */}
              <FormField
                label="Rarity"
                htmlFor="weapon-rarity"
                description="Item rarity tier (common to mythic)."
              >
                <select
                  id="weapon-rarity"
                  className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                  value={selected.rarity ?? ""}
                  onChange={(e) =>
                    updateSelected({
                      rarity: e.target.value || null,
                    })
                  }
                >
                  <option value="">None</option>
                  <option value="common">Common</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                  <option value="mythic">Mythic</option>
                </select>
              </FormField>

              <FormField
                label="Attunement"
                htmlFor="weapon-attunement"
                description="Requirements to attune or use this item."
              >
                <Input
                  id="weapon-attunement"
                  type="text"
                  value={selected.attunement ?? ""}
                  onChange={(e) =>
                    updateSelected({
                      attunement: e.target.value || null,
                    })
                  }
                />
              </FormField>

              <FormField
                label="Curse"
                htmlFor="weapon-curse"
                description="Drawbacks, corruption, oaths, or other negative effects."
              >
                <textarea
                  id="weapon-curse"
                  className="w-full min-h-[80px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                  value={selected.curse ?? ""}
                  onChange={(e) =>
                    updateSelected({
                      curse: e.target.value || null,
                    })
                  }
                />
              </FormField>

              {/* system hooks */}
              <FormField
                label="System Hooks"
                htmlFor="weapon-hooks"
                description="Structured effects for future automation: on_equip damage bonuses, passive effects, etc."
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
                        placeholder='e.g. "+2 damage on fire attacks" or "Applies burning condition on crit"'
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
              No weapon selected. Create or select one from the library.
            </p>
          )}
        </Card>

        {/* RIGHT: preview */}
        <Card className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-4 shadow-xl">
          <FormField
            label="Weapon Preview"
            htmlFor="weapon-preview"
            description="Copy-paste ready block for sheets, statblocks, or modules."
          >
            <textarea
              id="weapon-preview"
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
