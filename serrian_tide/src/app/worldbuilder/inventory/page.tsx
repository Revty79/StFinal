"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { GradientText } from "@/components/GradientText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { Input } from "@/components/Input";
import { Tabs } from "@/components/Tabs";

/* ---------- local nav ---------- */
function WBNav({
  current = "inventory",
}: {
  current?: "worlds" | "creatures" | "skillsets" | "races" | "inventory";
}) {
  const items = [
    { href: "/worldbuilder/worlds", key: "worlds", label: "Worlds" },
    { href: "/worldbuilder/creatures", key: "creatures", label: "Creatures" },
    { href: "/worldbuilder/skillsets", key: "skillsets", label: "Skillsets" },
    { href: "/worldbuilder/races", key: "races", label: "Races" },
    { href: "/worldbuilder/inventory", key: "inventory", label: "Inventory" },
  ] as const;

  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((it) => {
        const active = current === it.key;
        return (
          <Link
            key={it.key}
            href={it.href}
            className={[
              "rounded-xl px-3 py-1.5 text-sm border transition",
              active
                ? "border-violet-400/40 text-violet-200 bg-violet-400/10"
                : "border-white/15 text-zinc-200 hover:bg-white/10",
            ].join(" ")}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ---------- types & helpers ---------- */

type InventoryTabKey = "items" | "weapons" | "armor" | "preview";
type InventoryKind = "items" | "weapons" | "armor";

export type ItemRow = {
  id: string | number;
  name: string;
  is_free?: boolean;
  timeline_tag?: string | null;
  cost_credits?: number | null;
  category?: string | null;
  subtype?: string | null;
  genre_tags?: string | null;
  mechanical_effect?: string | null;
  weight?: number | null;
  narrative_notes?: string | null;
};

export type WeaponRow = {
  id: string | number;
  name: string;
  is_free?: boolean;
  timeline_tag?: string | null;
  cost_credits?: number | null;
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
};

export type ArmorRow = {
  id: string | number;
  name: string;
  is_free?: boolean;
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
};

type AnyRow = ItemRow | WeaponRow | ArmorRow;

const INVENTORY_TABS: { id: InventoryTabKey; label: string }[] = [
  { id: "items", label: "Items" },
  { id: "weapons", label: "Weapons" },
  { id: "armor", label: "Armor" },
  { id: "preview", label: "Preview" },
];

const uid = () => Math.random().toString(36).slice(2, 10);
const nv = (x: unknown) =>
  x === null || x === undefined || x === "" ? "—" : String(x);

/* ---------- main page ---------- */

export default function InventoryPage() {
  const router = useRouter();

  // Escape -> back/fallback
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (typeof window !== "undefined" && window.history.length > 1)
          router.back();
        else router.push("/worldbuilder");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  // inventory data
  const [items, setItems] = useState<ItemRow[]>([]);
  const [weapons, setWeapons] = useState<WeaponRow[]>([]);
  const [armor, setArmor] = useState<ArmorRow[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<InventoryTabKey>("items");
  const [kind, setKind] = useState<InventoryKind>("items"); // last non-preview kind
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qtext, setQtext] = useState("");
  const [loading, setLoading] = useState(true);

  // Load inventory from database on mount
  useEffect(() => {
    async function loadInventory() {
      try {
        const [itemsRes, weaponsRes, armorRes] = await Promise.all([
          fetch("/api/worldbuilder/inventory/items"),
          fetch("/api/worldbuilder/inventory/weapons"),
          fetch("/api/worldbuilder/inventory/armor"),
        ]);

        const [itemsData, weaponsData, armorData] = await Promise.all([
          itemsRes.json(),
          weaponsRes.json(),
          armorRes.json(),
        ]);

        if (!itemsData.ok || !weaponsData.ok || !armorData.ok) {
          throw new Error("Failed to load inventory");
        }

        setItems((itemsData.items || []).map((i: any) => ({ ...i, is_free: i.isFree })));
        setWeapons((weaponsData.weapons || []).map((w: any) => ({ ...w, is_free: w.isFree })));
        setArmor((armorData.armor || []).map((a: any) => ({ ...a, is_free: a.isFree })));
      } catch (error) {
        console.error("Error loading inventory:", error);
        alert(`Failed to load inventory: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    }

    loadInventory();
  }, []);

  const currentKind: InventoryKind = kind;

  const currentList: AnyRow[] = useMemo(() => {
    if (currentKind === "items") return items;
    if (currentKind === "weapons") return weapons;
    return armor;
  }, [currentKind, items, weapons, armor]);

  const selected: AnyRow | null = useMemo(
    () =>
      currentList.find((r) => String(r.id) === String(selectedId ?? "")) ??
      null,
    [currentList, selectedId]
  );

  // ensure something is selected when switching kinds
  useEffect(() => {
    if (!currentList.length) {
      setSelectedId(null);
      return;
    }
    if (!selected) {
      const first = currentList[0];
      if (first) {
        setSelectedId(String(first.id));
      }
    }
  }, [currentList, selected]);

  const filteredList = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter((r) => {
      const base = [
        r.name,
        "category" in r ? (r as any).category ?? "" : "",
        "genre_tags" in r ? (r as any).genre_tags ?? "" : "",
      ]
        .join(" ")
        .toLowerCase();
      return base.includes(q);
    });
  }, [currentList, qtext]);

  /* ---------- CRUD helpers (UI-only) ---------- */

  function createRecord() {
    const id = uid();
    const nowName =
      currentKind === "items"
        ? "New Item"
        : currentKind === "weapons"
        ? "New Weapon"
        : "New Armor";

    if (currentKind === "items") {
      const row: ItemRow = {
        id,
        name: nowName,
        is_free: true,
        timeline_tag: null,
        cost_credits: null,
        category: null,
        subtype: null,
        genre_tags: null,
        mechanical_effect: null,
        weight: null,
        narrative_notes: null,
      };
      setItems((prev) => [row, ...prev]);
    } else if (currentKind === "weapons") {
      const row: WeaponRow = {
        id,
        name: nowName,
        is_free: true,
        timeline_tag: null,
        cost_credits: null,
        category: null,
        handedness: null,
        dtype: null,
        range_type: null,
        range_text: null,
        genre_tags: null,
        weight: null,
        damage: null,
        effect: null,
        narrative_notes: null,
      };
      setWeapons((prev) => [row, ...prev]);
    } else {
      const row: ArmorRow = {
        id,
        name: nowName,
        is_free: true,
        timeline_tag: null,
        cost_credits: null,
        area_covered: null,
        soak: null,
        category: null,
        atype: null,
        genre_tags: null,
        weight: null,
        encumbrance_penalty: null,
        effect: null,
        narrative_notes: null,
      };
      setArmor((prev) => [row, ...prev]);
    }
    setSelectedId(id);
    if (activeTab === "preview") {
      setActiveTab(currentKind);
    }
  }

  async function deleteSelected() {
    if (!selected) return;
    const idStr = String(selected.id);
    if (!confirm("Delete this record from the inventory?")) return;

    const isNew = typeof selected.id === "string" && selected.id.length < 20;

    if (isNew) {
      if (currentKind === "items") {
        setItems((prev) => prev.filter((r) => String(r.id) !== idStr));
      } else if (currentKind === "weapons") {
        setWeapons((prev) => prev.filter((r) => String(r.id) !== idStr));
      } else {
        setArmor((prev) => prev.filter((r) => String(r.id) !== idStr));
      }
      setSelectedId(null);
      return;
    }

    try {
      const response = await fetch(`/api/worldbuilder/inventory/${currentKind}/${selected.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to delete record");
      }

      if (currentKind === "items") {
        setItems((prev) => prev.filter((r) => String(r.id) !== idStr));
      } else if (currentKind === "weapons") {
        setWeapons((prev) => prev.filter((r) => String(r.id) !== idStr));
      } else {
        setArmor((prev) => prev.filter((r) => String(r.id) !== idStr));
      }
      setSelectedId(null);
      alert("Record deleted successfully!");
    } catch (error) {
      console.error("Error deleting record:", error);
      alert(`Failed to delete record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  function renameSelected(newName: string) {
    if (!selected) return;
    const idStr = String(selected.id);
    if (currentKind === "items") {
      setItems((prev) =>
        prev.map((r) =>
          String(r.id) === idStr ? ({ ...r, name: newName } as ItemRow) : r
        )
      );
    } else if (currentKind === "weapons") {
      setWeapons((prev) =>
        prev.map((r) =>
          String(r.id) === idStr ? ({ ...r, name: newName } as WeaponRow) : r
        )
      );
    } else {
      setArmor((prev) =>
        prev.map((r) =>
          String(r.id) === idStr ? ({ ...r, name: newName } as ArmorRow) : r
        )
      );
    }
  }

  function updateSelected(
    patch: Partial<ItemRow> | Partial<WeaponRow> | Partial<ArmorRow>
  ) {
    if (!selected) return;
    const idStr = String(selected.id);

    if (currentKind === "items") {
      setItems((prev) =>
        prev.map((r) =>
          String(r.id) === idStr ? ({ ...r, ...patch } as ItemRow) : r
        )
      );
    } else if (currentKind === "weapons") {
      setWeapons((prev) =>
        prev.map((r) =>
          String(r.id) === idStr ? ({ ...r, ...patch } as WeaponRow) : r
        )
      );
    } else {
      setArmor((prev) =>
        prev.map((r) =>
          String(r.id) === idStr ? ({ ...r, ...patch } as ArmorRow) : r
        )
      );
    }
  }

  async function saveSelected() {
    if (!selected) return;
    
    try {
      let payload: any = {
        name: selected.name,
        isFree: selected.is_free ?? true,
      };

      if (currentKind === "items") {
        const item = selected as ItemRow;
        payload = {
          ...payload,
          timelineTag: item.timeline_tag,
          costCredits: item.cost_credits,
          category: item.category,
          subtype: item.subtype,
          genreTags: item.genre_tags,
          mechanicalEffect: item.mechanical_effect,
          weight: item.weight,
          narrativeNotes: item.narrative_notes,
        };
      } else if (currentKind === "weapons") {
        const weapon = selected as WeaponRow;
        payload = {
          ...payload,
          timelineTag: weapon.timeline_tag,
          costCredits: weapon.cost_credits,
          category: weapon.category,
          handedness: weapon.handedness,
          dtype: weapon.dtype,
          rangeType: weapon.range_type,
          rangeText: weapon.range_text,
          genreTags: weapon.genre_tags,
          weight: weapon.weight,
          damage: weapon.damage,
          effect: weapon.effect,
          narrativeNotes: weapon.narrative_notes,
        };
      } else {
        const armorItem = selected as ArmorRow;
        payload = {
          ...payload,
          timelineTag: armorItem.timeline_tag,
          costCredits: armorItem.cost_credits,
          areaCovered: armorItem.area_covered,
          soak: armorItem.soak,
          category: armorItem.category,
          atype: armorItem.atype,
          genreTags: armorItem.genre_tags,
          weight: armorItem.weight,
          encumbrancePenalty: armorItem.encumbrance_penalty,
          effect: armorItem.effect,
          narrativeNotes: armorItem.narrative_notes,
        };
      }

      const isNew = typeof selected.id === "string" && selected.id.length < 20;

      let response;
      if (isNew) {
        response = await fetch(`/api/worldbuilder/inventory/${currentKind}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`/api/worldbuilder/inventory/${currentKind}/${selected.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to save record");
      }

      if (isNew) {
        const oldId = selected.id;
        const savedRecord = data.item || data.weapon || data.armor;
        if (savedRecord) {
          const transformed = { ...savedRecord, is_free: savedRecord.isFree };
          if (currentKind === "items") {
            setItems((prev) =>
              prev.map((r) => (String(r.id) === String(oldId) ? transformed : r))
            );
          } else if (currentKind === "weapons") {
            setWeapons((prev) =>
              prev.map((r) => (String(r.id) === String(oldId) ? transformed : r))
            );
          } else {
            setArmor((prev) =>
              prev.map((r) => (String(r.id) === String(oldId) ? transformed : r))
            );
          }
          setSelectedId(savedRecord.id);
        }
      }

      alert("Record saved successfully!");
    } catch (error) {
      console.error("Error saving record:", error);
      alert(`Failed to save record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /* ---------- preview text ---------- */

  const previewText = useMemo(() => {
    if (!selected) return "";
    if (currentKind === "items") {
      const i = selected as ItemRow;
      return [
        `Item: ${i.name}`,
        `Timeline: ${nv(i.timeline_tag)}  Cost: ${nv(i.cost_credits)}`,
        `Category/Subtype: ${nv(i.category)} / ${nv(i.subtype)}`,
        `Tags: ${nv(i.genre_tags)}`,
        `Effect: ${nv(i.mechanical_effect)}`,
        `Weight: ${nv(i.weight)}`,
        `Notes: ${nv(i.narrative_notes)}`,
      ].join("\n");
    } else if (currentKind === "weapons") {
      const w = selected as WeaponRow;
      return [
        `Weapon: ${w.name}`,
        `Timeline: ${nv(w.timeline_tag)}  Cost: ${nv(w.cost_credits)}`,
        `Category: ${nv(w.category)}  Handedness: ${nv(w.handedness)}`,
        `Damage Type: ${nv(w.dtype)}  Damage: ${nv(w.damage)}`,
        `Range Type: ${nv(w.range_type)}  Range: ${nv(w.range_text)}`,
        `Tags: ${nv(w.genre_tags)}`,
        `Weight: ${nv(w.weight)}`,
        `Effect: ${nv(w.effect)}`,
        `Notes: ${nv(w.narrative_notes)}`,
      ].join("\n");
    } else {
      const a = selected as ArmorRow;
      return [
        `Armor: ${a.name}`,
        `Timeline: ${nv(a.timeline_tag)}  Cost: ${nv(a.cost_credits)}`,
        `Area Covered: ${nv(a.area_covered)}  Soak: ${nv(a.soak)}`,
        `Category: ${nv(a.category)}  Type: ${nv(a.atype)}`,
        `Tags: ${nv(a.genre_tags)}`,
        `Weight: ${nv(a.weight)}  Encumbrance: ${nv(a.encumbrance_penalty)}`,
        `Effect: ${nv(a.effect)}`,
        `Notes: ${nv(a.narrative_notes)}`,
      ].join("\n");
    }
  }, [selected, currentKind]);

  const kindLabel =
    currentKind === "items"
      ? "Item"
      : currentKind === "weapons"
      ? "Weapon"
      : "Armor";

  /* ---------- render ---------- */

  return (
    <main className="min-h-screen px-6 py-10">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <GradientText
              as="h1"
              variant="title"
              glow
              className="font-evanescent text-4xl sm:text-5xl tracking-tight"
            >
              The Source Forge — Inventory
            </GradientText>
            <p className="mt-1 text-sm text-zinc-300/90 max-w-2xl">
              Build items, weapons, and armor that your worlds, eras, and
              campaigns can adopt. This screen is UI-only; DB/API wiring comes
              next.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Link href="/worldbuilder">
              <Button variant="secondary" size="sm" type="button">
                ← Source Forge
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex justify-end">
          <WBNav current="inventory" />
        </div>
      </header>

      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
        {/* LEFT: library */}
        <Card
          padded={false}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-200">
              Inventory Library
            </h2>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={createRecord}
            >
              + New {kindLabel}
            </Button>
          </div>

          {/* Filter */}
          <div className="space-y-2">
            <Input
              value={qtext}
              onChange={(e) => setQtext(e.target.value)}
              placeholder={`Search ${kindLabel.toLowerCase()}s by name/tags…`}
            />
          </div>

          {/* List */}
          <div className="mt-2 flex-1 min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 border-b border-white/10">
              <span>
                {kindLabel}s: {filteredList.length}
              </span>
              <span className="uppercase tracking-wide text-[10px] text-zinc-500">
                {kindLabel} records
              </span>
            </div>

            <div className="max-h-[420px] overflow-auto">
              {filteredList.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">
                  No {kindLabel.toLowerCase()}s yet. Create your first one.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-left text-zinc-400">
                    <tr>
                      <th className="px-3 py-1">Name</th>
                      {currentKind === "items" && (
                        <>
                          <th className="px-3 py-1">Category</th>
                          <th className="px-3 py-1">Cost</th>
                        </>
                      )}
                      {currentKind === "weapons" && (
                        <>
                          <th className="px-3 py-1">Category</th>
                          <th className="px-3 py-1">Damage</th>
                        </>
                      )}
                      {currentKind === "armor" && (
                        <>
                          <th className="px-3 py-1">Area</th>
                          <th className="px-3 py-1">Soak</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((r) => {
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
                            <div className="flex items-center gap-2">
                              <span>{r.name || "(unnamed)"}</span>
                            </div>
                          </td>

                          {currentKind === "items" && (
                            <>
                              <td className="px-3 py-1.5">
                                {nv((r as ItemRow).category)}
                              </td>
                              <td className="px-3 py-1.5">
                                {nv((r as ItemRow).cost_credits)}
                              </td>
                            </>
                          )}
                          {currentKind === "weapons" && (
                            <>
                              <td className="px-3 py-1.5">
                                {nv((r as WeaponRow).category)}
                              </td>
                              <td className="px-3 py-1.5">
                                {nv((r as WeaponRow).damage)}
                              </td>
                            </>
                          )}
                          {currentKind === "armor" && (
                            <>
                              <td className="px-3 py-1.5">
                                {nv((r as ArmorRow).area_covered)}
                              </td>
                              <td className="px-3 py-1.5">
                                {nv((r as ArmorRow).soak)}
                              </td>
                            </>
                          )}
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
                disabled={!selected}
                onClick={deleteSelected}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>

        {/* RIGHT: editor */}
        <Card
          padded={false}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl"
        >
          {loading ? (
            <p className="text-sm text-zinc-400">
              Loading inventory...
            </p>
          ) : !selected ? (
            <p className="text-sm text-zinc-400">
              Select a {kindLabel.toLowerCase()} on the left or create a new
              one to begin editing.
            </p>
          ) : (
            <>
              <div className="mb-4 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1">
                  <Input
                    value={selected.name}
                    onChange={(e) => updateSelected({ name: e.target.value })}
                    placeholder={`${kindLabel} name (e.g., Lantern, Longsword, Chainmail...)`}
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">
                    This is the label your players and other tools will see
                    everywhere.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.is_free ?? true}
                        onChange={(e) =>
                          updateSelected({ is_free: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-white/20 bg-black/30 text-violet-500 focus:ring-violet-500/50"
                      />
                      <span className="text-sm text-zinc-300">
                        Free (available to all users)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  <Tabs
                    tabs={INVENTORY_TABS}
                    activeId={activeTab}
                    onChange={(id) => {
                      const tabId = id as InventoryTabKey;
                      setActiveTab(tabId);
                      if (
                        tabId === "items" ||
                        tabId === "weapons" ||
                        tabId === "armor"
                      ) {
                        setKind(tabId);
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      type="button"
                      onClick={saveSelected}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* ITEMS */}
                {activeTab === "items" && currentKind === "items" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Timeline Tag" htmlFor="item-timeline">
                        <Input
                          id="item-timeline"
                          value={(selected as ItemRow).timeline_tag ?? ""}
                          onChange={(e) =>
                            updateSelected({ timeline_tag: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField label="Cost (Credits)" htmlFor="item-cost">
                        <Input
                          id="item-cost"
                          type="number"
                          value={(selected as ItemRow).cost_credits ?? ""}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Category" htmlFor="item-category">
                        <Input
                          id="item-category"
                          value={(selected as ItemRow).category ?? ""}
                          onChange={(e) =>
                            updateSelected({ category: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField label="Subtype" htmlFor="item-subtype">
                        <Input
                          id="item-subtype"
                          value={(selected as ItemRow).subtype ?? ""}
                          onChange={(e) =>
                            updateSelected({ subtype: e.target.value })
                          }
                        />
                      </FormField>
                    </div>

                    <FormField
                      label="Genre Tags"
                      htmlFor="item-tags"
                      description="Comma- or space-separated tags (fantasy, sci-fi, cyberpunk…)."
                    >
                      <Input
                        id="item-tags"
                        value={(selected as ItemRow).genre_tags ?? ""}
                        onChange={(e) =>
                          updateSelected({ genre_tags: e.target.value })
                        }
                      />
                    </FormField>

                    <FormField
                      label="Mechanical Effect"
                      htmlFor="item-effect"
                      description="What this item does at the table: bonuses, checks, special interactions."
                    >
                      <textarea
                        id="item-effect"
                        className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={(selected as ItemRow).mechanical_effect ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            mechanical_effect: e.target.value,
                          })
                        }
                      />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Weight" htmlFor="item-weight">
                        <Input
                          id="item-weight"
                          type="number"
                          value={(selected as ItemRow).weight ?? ""}
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

                    <FormField
                      label="Narrative Notes"
                      htmlFor="item-notes"
                      description="Lore hooks, description, or how this feels in play."
                    >
                      <textarea
                        id="item-notes"
                        className="w-full min-h-[140px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={(selected as ItemRow).narrative_notes ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            narrative_notes: e.target.value,
                          })
                        }
                      />
                    </FormField>
                  </div>
                )}

                {/* WEAPONS */}
                {activeTab === "weapons" && currentKind === "weapons" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        label="Timeline Tag"
                        htmlFor="weapon-timeline"
                      >
                        <Input
                          id="weapon-timeline"
                          value={(selected as WeaponRow).timeline_tag ?? ""}
                          onChange={(e) =>
                            updateSelected({ timeline_tag: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField label="Cost (Credits)" htmlFor="weapon-cost">
                        <Input
                          id="weapon-cost"
                          type="number"
                          value={(selected as WeaponRow).cost_credits ?? ""}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Category" htmlFor="weapon-category">
                        <Input
                          id="weapon-category"
                          value={(selected as WeaponRow).category ?? ""}
                          onChange={(e) =>
                            updateSelected({ category: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField label="Handedness" htmlFor="weapon-hand">
                        <Input
                          id="weapon-hand"
                          value={(selected as WeaponRow).handedness ?? ""}
                          onChange={(e) =>
                            updateSelected({ handedness: e.target.value })
                          }
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Damage Type" htmlFor="weapon-dtype">
                        <Input
                          id="weapon-dtype"
                          value={(selected as WeaponRow).dtype ?? ""}
                          onChange={(e) =>
                            updateSelected({ dtype: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField label="Damage" htmlFor="weapon-damage">
                        <Input
                          id="weapon-damage"
                          type="number"
                          value={(selected as WeaponRow).damage ?? ""}
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
                      <FormField
                        label="Range Type"
                        htmlFor="weapon-range-type"
                      >
                        <Input
                          id="weapon-range-type"
                          value={(selected as WeaponRow).range_type ?? ""}
                          onChange={(e) =>
                            updateSelected({ range_type: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField label="Range Text" htmlFor="weapon-range">
                        <Input
                          id="weapon-range"
                          value={(selected as WeaponRow).range_text ?? ""}
                          onChange={(e) =>
                            updateSelected({ range_text: e.target.value })
                          }
                        />
                      </FormField>
                    </div>

                    <FormField
                      label="Genre Tags"
                      htmlFor="weapon-tags"
                      description="Comma- or space-separated tags (fantasy, sci-fi, etc.)."
                    >
                      <Input
                        id="weapon-tags"
                        value={(selected as WeaponRow).genre_tags ?? ""}
                        onChange={(e) =>
                          updateSelected({ genre_tags: e.target.value })
                        }
                      />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Weight" htmlFor="weapon-weight">
                        <Input
                          id="weapon-weight"
                          type="number"
                          value={(selected as WeaponRow).weight ?? ""}
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

                    <FormField
                      label="Effect"
                      htmlFor="weapon-effect"
                      description="Mechanical and dramatic impact: crit riders, status effects, etc."
                    >
                      <textarea
                        id="weapon-effect"
                        className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={(selected as WeaponRow).effect ?? ""}
                        onChange={(e) =>
                          updateSelected({ effect: e.target.value })
                        }
                      />
                    </FormField>

                    <FormField label="Narrative Notes" htmlFor="weapon-notes">
                      <textarea
                        id="weapon-notes"
                        className="w-full min-h-[140px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={(selected as WeaponRow).narrative_notes ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            narrative_notes: e.target.value,
                          })
                        }
                      />
                    </FormField>
                  </div>
                )}

                {/* ARMOR */}
                {activeTab === "armor" && currentKind === "armor" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        label="Timeline Tag"
                        htmlFor="armor-timeline"
                      >
                        <Input
                          id="armor-timeline"
                          value={(selected as ArmorRow).timeline_tag ?? ""}
                          onChange={(e) =>
                            updateSelected({ timeline_tag: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField label="Cost (Credits)" htmlFor="armor-cost">
                        <Input
                          id="armor-cost"
                          type="number"
                          value={(selected as ArmorRow).cost_credits ?? ""}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Area Covered" htmlFor="armor-area">
                        <Input
                          id="armor-area"
                          value={(selected as ArmorRow).area_covered ?? ""}
                          onChange={(e) =>
                            updateSelected({ area_covered: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField label="Soak" htmlFor="armor-soak">
                        <Input
                          id="armor-soak"
                          type="number"
                          value={(selected as ArmorRow).soak ?? ""}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Category" htmlFor="armor-category">
                        <Input
                          id="armor-category"
                          value={(selected as ArmorRow).category ?? ""}
                          onChange={(e) =>
                            updateSelected({ category: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField label="Armor Type" htmlFor="armor-type">
                        <Input
                          id="armor-type"
                          value={(selected as ArmorRow).atype ?? ""}
                          onChange={(e) =>
                            updateSelected({ atype: e.target.value })
                          }
                        />
                      </FormField>
                    </div>

                    <FormField
                      label="Genre Tags"
                      htmlFor="armor-tags"
                      description="Comma- or space-separated tags."
                    >
                      <Input
                        id="armor-tags"
                        value={(selected as ArmorRow).genre_tags ?? ""}
                        onChange={(e) =>
                          updateSelected({ genre_tags: e.target.value })
                        }
                      />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Weight" htmlFor="armor-weight">
                        <Input
                          id="armor-weight"
                          type="number"
                          value={(selected as ArmorRow).weight ?? ""}
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
                      >
                        <Input
                          id="armor-enc"
                          type="number"
                          value={
                            (selected as ArmorRow).encumbrance_penalty ?? ""
                          }
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

                    <FormField
                      label="Effect"
                      htmlFor="armor-effect"
                      description="Mechanical behavior at the table."
                    >
                      <textarea
                        id="armor-effect"
                        className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={(selected as ArmorRow).effect ?? ""}
                        onChange={(e) =>
                          updateSelected({ effect: e.target.value })
                        }
                      />
                    </FormField>

                    <FormField label="Narrative Notes" htmlFor="armor-notes">
                      <textarea
                        id="armor-notes"
                        className="w-full min-h-[140px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={(selected as ArmorRow).narrative_notes ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            narrative_notes: e.target.value,
                          })
                        }
                      />
                    </FormField>
                  </div>
                )}

                {/* PREVIEW */}
                {activeTab === "preview" && (
                  <div>
                    <FormField
                      label="Inventory Preview"
                      htmlFor="inventory-preview"
                      description="Quick text block you can drop into sheets, handouts, or modules."
                    >
                      <textarea
                        id="inventory-preview"
                        readOnly
                        value={previewText}
                        className="w-full h-[400px] rounded-lg border border-white/10 bg-neutral-950/70 px-3 py-2 text-xs text-zinc-200 font-mono"
                      />
                    </FormField>

                    <div className="mt-2 text-[11px] text-zinc-500">
                      Items, weapons, and armor all share the same builder shell
                      here. Down the line, DB tables will mirror these fields
                      and link into races, creatures, and campaign packs.
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </section>
    </main>
  );
}
