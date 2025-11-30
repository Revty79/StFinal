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

export type ItemRow = {
  id: string | number;
  name: string;

  // common meta
  is_free?: boolean;
  createdBy?: string;
  timeline_tag?: string | null;
  cost_credits?: number | null;
  genre_tags?: string | null;

  // inventory logic for this page
  category?: string | null;
  subtype?: string | null;
  weight?: number | null;

  mechanical_effect?: string | null;
  narrative_notes?: string | null;

  // usage & structured effects (site-side only for now)
  usage_type?: UsageType | null;
  max_charges?: number | null;
  recharge_window?: RechargeWindow | null;
  recharge_notes?: string | null;
  effect_hooks?: ItemHook[] | null;
};

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

const uid = () => Math.random().toString(36).slice(2, 10);

const nv = (x: unknown) =>
  x === null || x === undefined || x === "" ? "—" : String(x);

// some quick genre-tag presets to click-add
const GENRE_PRESETS = [
  "fantasy",
  "dark_fantasy",
  "sci_fi",
  "cyberpunk",
  "post_apoc",
  "steampunk",
  "modern",
] as const;

/* ---------- Batch TSV parsing ---------- */

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[()]/g, "");
}

function parseTSVToItemRecords(raw: string): ItemRow[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error("Need a header row plus at least one data row.");
  }

  const headerCells = (lines[0] ?? "").split("\t").map((h) => h.trim());
  const headersNorm = headerCells.map(normalizeHeader);

  const findIndex = (...candidates: string[]) => {
    for (const c of candidates) {
      const norm = c.toLowerCase().replace(/[()]/g, "");
      const i = headersNorm.findIndex((h) => h === norm);
      if (i !== -1) return i;
    }
    return -1;
  };

  const records: ItemRow[] = [];

  for (let li = 1; li < lines.length; li++) {
    const cols = (lines[li] ?? "").split("\t");

    const get = (...names: string[]): string => {
      const idx = findIndex(...names);
      if (idx === -1) return "";
      return (cols[idx] ?? "").trim();
    };

    const name = get("Item Name", "Name");
    if (!name) continue; // skip blank row

    const timelineTag = get("Timeline Tag");
    const costCredits = get("Cost Credits", "Cost");
    const category = get("Category");
    const subtype = get("Subtype");
    const genreTags = get("Genre Tags");
    const mechanicalEffect = get("Mechanical Effect");
    const weight = get("Weight");
    const narrativeNotes = get("Narrative/Variant Notes", "Narrative Notes");

    const rec: ItemRow = {
      id: uid(),
      name,
      is_free: false,
      timeline_tag: timelineTag || null,
      cost_credits: costCredits ? parseFloat(costCredits) : null,
      category: category || null,
      subtype: subtype || null,
      genre_tags: genreTags || null,
      mechanical_effect: mechanicalEffect || null,
      weight: weight ? parseFloat(weight) : null,
      narrative_notes: narrativeNotes || null,
    };

    records.push(rec);
  }

  return records;
}

/* ---------- main page ---------- */

export default function InventoryItemsPage() {
  const router = useRouter();

  // Escape → back/hub
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

  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [qtext, setQtext] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: string;
  } | null>(null);

  /** Local system hooks per item id (not persisted yet) */
  const [hooksByItem, setHooksByItem] = useState<Record<string, ItemHook[]>>(
    {}
  );

  // Batch uploader state
  const [batchText, setBatchText] = useState("");
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchPreview, setBatchPreview] = useState<ItemRow[]>([]);
  const [batchUploading, setBatchUploading] = useState(false);

  const isAdmin = currentUser?.role?.toLowerCase() === "admin";

  // Load user + items
  useEffect(() => {
    async function loadItems() {
      try {
        const userRes = await fetch("/api/profile/me");
        const userData = await userRes.json();
        if (userData.ok && userData.user) {
          setCurrentUser({ id: userData.user.id, role: userData.user.role });
        }

        const itemsRes = await fetch("/api/worldbuilder/inventory/items");
        const itemsData = await itemsRes.json();

        if (!itemsData.ok) {
          throw new Error(itemsData.error || "Failed to load items");
        }

        const mapped: ItemRow[] = (itemsData.items || []).map((i: any) => ({
          ...i,
          is_free: i.isFree,
          shop_ready: i.shopReady,
          shop_role: i.shopRole ?? null,

          // usage / charges (future DB fields, safe to be undefined for now)
          usage_type: i.usageType ?? i.usage_type ?? null,
          max_charges: i.maxCharges ?? i.max_charges ?? null,
          recharge_window: i.rechargeWindow ?? i.recharge_window ?? null,
          recharge_notes: i.rechargeNotes ?? i.recharge_notes ?? null,

          // structured hooks (when you start persisting them)
          effect_hooks: i.effectHooks ?? i.effect_hooks ?? null,
        }));

        setItems(mapped);

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
        console.error("Error loading items:", err);
        alert(
          `Failed to load items: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    }

    loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => {
      const base = [
        r.name,
        r.category ?? "",
        r.subtype ?? "",
        r.genre_tags ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return base.includes(q);
    });
  }, [items, qtext]);

  const selected: ItemRow | null = useMemo(
    () =>
      filteredItems.find((r) => String(r.id) === String(selectedId ?? "")) ??
      null,
    [filteredItems, selectedId]
  );

  // ensure we always have a selection if list changes
  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedId(null);
      return;
    }
    if (!selected && filteredItems[0]) {
      setSelectedId(String(filteredItems[0].id));
    }
  }, [filteredItems, selected]);

  const currentHooks: ItemHook[] = useMemo(() => {
    if (!selected) return [];
    return hooksByItem[String(selected.id)] ?? [];
  }, [hooksByItem, selected]);

  /* ---------- CRUD helpers ---------- */

  function createItem() {
    const id = uid();
    const newItem: ItemRow = {
      id,
      name: "New Item",
      is_free: false,
      timeline_tag: null,
      cost_credits: null,
      category: "gear",
      subtype: null,
      genre_tags: "",
      weight: null,
      mechanical_effect: "",
      narrative_notes: "",
    };

    setItems((prev) => [newItem, ...prev]);
    setSelectedId(id);
  }

  async function deleteSelected() {
    if (!selected || !currentUser) return;
    const idStr = String(selected.id);

    const isNew = typeof selected.id === "string" && selected.id.length < 20;
    const isAdmin = currentUser.role?.toLowerCase() === "admin";
    const isCreator = selected.createdBy === currentUser.id;

    if (!isNew && !isAdmin && !isCreator) {
      alert("You can only delete items you created (admins can delete any).");
      return;
    }

    if (!confirm("Delete this item from the inventory?")) return;

    const removeFromState = () => {
      setItems((prev) => prev.filter((r) => String(r.id) !== idStr));
      setHooksByItem((prev) => {
        const next = { ...prev };
        delete next[idStr];
        return next;
      });
    };

    if (isNew) {
      removeFromState();
      setSelectedId(null);
      return;
    }

    try {
      const res = await fetch(`/api/worldbuilder/inventory/items/${selected.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to delete item");
      }
      removeFromState();
      setSelectedId(null);
      alert("Item deleted.");
    } catch (err) {
      console.error("Error deleting item:", err);
      alert(
        `Failed to delete item: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }

  function renameSelected(newName: string) {
    if (!selected) return;
    const idStr = String(selected.id);
    setItems((prev) =>
      prev.map((r) => (String(r.id) === idStr ? { ...r, name: newName } : r))
    );
  }

  function updateSelected(patch: Partial<ItemRow>) {
    if (!selected) return;
    const idStr = String(selected.id);
    setItems((prev) =>
      prev.map((r) =>
        String(r.id) === idStr ? ({ ...r, ...patch } as ItemRow) : r
      )
    );
  }

  async function saveSelected() {
    if (!selected) return;

    try {
      const isNew = typeof selected.id === "string" && selected.id.length < 20;

      // payload aligned to existing API fields
      const payload: any = {
        name: selected.name,
        isFree: selected.is_free ?? false,
        timelineTag: selected.timeline_tag ?? null,
        costCredits: selected.cost_credits ?? null,
        category: selected.category ?? null,
        subtype: selected.subtype ?? null,
        genreTags: selected.genre_tags ?? null,
        weight: selected.weight ?? null,
        mechanicalEffect: selected.mechanical_effect ?? null,
        narrativeNotes: selected.narrative_notes ?? null,
        usageType: selected.usage_type ?? null,
        maxCharges: selected.max_charges ?? null,
        rechargeWindow: selected.recharge_window ?? null,
        rechargeNotes: selected.recharge_notes ?? null,
        effectHooks: currentHooks.length > 0 ? currentHooks : null,
      };

      let res;
      if (isNew) {
        res = await fetch("/api/worldbuilder/inventory/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(
          `/api/worldbuilder/inventory/items/${selected.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to save item");
      }

      if (isNew) {
        const oldId = selected.id;
        const saved = data.item;
        if (saved) {
          const transformed: ItemRow = {
            ...saved,
            is_free: saved.isFree,
            shop_ready: saved.shopReady,
            shop_role: saved.shopRole ?? null,
          };

          setItems((prev) =>
            prev.map((r) =>
              String(r.id) === String(oldId) ? transformed : r
            )
          );
          setSelectedId(String(saved.id));

          // move hooks to the new id if any
          setHooksByItem((prev) => {
            const next = { ...prev };
            const hooksForOld = next[String(oldId)];
            if (hooksForOld) {
              delete next[String(oldId)];
              next[String(saved.id)] = hooksForOld;
            }
            return next;
          });
        }
      }

      alert("Item saved.");
    } catch (err) {
      console.error("Error saving item:", err);
      alert(
        `Failed to save item: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }

  /* ---------- batch uploader actions ---------- */

  function handleParseBatch() {
    try {
      if (!batchText.trim()) {
        setBatchError("Paste tab-separated rows from your sheet first.");
        setBatchPreview([]);
        return;
      }
      const parsed = parseTSVToItemRecords(batchText);
      if (!parsed.length) {
        setBatchError("No valid item rows found.");
        setBatchPreview([]);
        return;
      }
      setBatchPreview(parsed);
      setBatchError(null);
    } catch (err) {
      console.error("Batch parse error:", err);
      setBatchPreview([]);
      setBatchError(
        err instanceof Error ? err.message : "Failed to parse batch data."
      );
    }
  }

  async function handleCommitBatch() {
    if (!isAdmin) return;
    if (!batchPreview.length) {
      alert("Parse some data first.");
      return;
    }
    if (
      !confirm(
        `Import/update ${batchPreview.length} items? Matches are based on item name (case-insensitive).`
      )
    ) {
      return;
    }

    setBatchUploading(true);
    try {
      const updatedItems = [...items];

      for (const row of batchPreview) {
        const name = row.name.trim();
        if (!name) continue;

        const existingIdx = updatedItems.findIndex(
          (i) => i.name.trim().toLowerCase() === name.toLowerCase()
        );

        const payload = {
          name: row.name,
          isFree: row.is_free ?? false,
          timelineTag: row.timeline_tag,
          costCredits: row.cost_credits,
          category: row.category,
          subtype: row.subtype,
          genreTags: row.genre_tags,
          mechanicalEffect: row.mechanical_effect,
          weight: row.weight,
          narrativeNotes: row.narrative_notes,
        };

        let response;
        if (existingIdx >= 0) {
          // Update existing item by name
          const existing = updatedItems[existingIdx];
          if (!existing) continue;
          response = await fetch(`/api/worldbuilder/inventory/items/${existing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } else {
          // Create new item
          response = await fetch("/api/worldbuilder/inventory/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }

        const data = await response.json();
        if (!data.ok) {
          throw new Error(
            data.error || `Failed to save item "${row.name}"`
          );
        }

        if (existingIdx >= 0) {
          // Update existing item in state
          const existing = updatedItems[existingIdx];
          if (!existing) continue;
          updatedItems[existingIdx] = {
            ...existing,
            ...row,
          };
        } else if (data.item) {
          // Add new item using the preview data plus server ID
          updatedItems.unshift({
            ...row,
            id: data.item.id,
            createdBy: currentUser?.id,
          });
        }
      }

      setItems(updatedItems);
      setBatchText("");
      setBatchPreview([]);
      setBatchError(null);
      alert("Batch upload complete.");
    } catch (err) {
      console.error("Batch upload error:", err);
      alert(
        `Batch upload failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setBatchUploading(false);
    }
  }

  /* ---------- system hooks helpers (local only) ---------- */

  function addHook() {
    if (!selected) return;
    const idStr = String(selected.id);
    const newHook: ItemHook = {
      id: uid(),
      trigger: "on_use",
      target: "self",
      kind: "heal",
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
    setHooksByItem((prev) => {
      const curr = prev[idStr] ?? [];
      return {
        ...prev,
        [idStr]: curr.map((h) =>
          h.id === hookId ? ({ ...h, ...patch } as ItemHook) : h
        ),
      };
    });
  }

  function removeHook(hookId: string) {
    if (!selected) return;
    const idStr = String(selected.id);
    setHooksByItem((prev) => {
      const curr = prev[idStr] ?? [];
      return {
        ...prev,
        [idStr]: curr.filter((h) => h.id !== hookId),
      };
    });
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

  /* ---------- preview text ---------- */

  const previewText = useMemo(() => {
    if (!selected) return "";
    const lines: string[] = [];

    lines.push(`Item: ${selected.name}`);
    lines.push(
      `Timeline: ${nv(selected.timeline_tag)}   Cost: ${nv(
        selected.cost_credits
      )}`
    );
    lines.push(
      `Category/Subtype: ${nv(selected.category)} / ${nv(selected.subtype)}`
    );
    lines.push(`Tags: ${nv(selected.genre_tags)}`);
    lines.push(`Weight: ${nv(selected.weight)}`);

    // usage summary
    if (selected.usage_type) {
      lines.push("");
      let usageLine = "Usage: ";
      if (selected.usage_type === "consumable") {
        usageLine += "Consumable (one use)";
      } else if (selected.usage_type === "charges") {
        usageLine += `Charges: ${nv(selected.max_charges)} (${nv(
          selected.recharge_window
        )})`;
      } else if (selected.usage_type === "at_will") {
        usageLine += "At-will";
      } else {
        usageLine += "Custom";
      }
      lines.push(usageLine);
      if (selected.recharge_notes) {
        lines.push(`  Recharge: ${selected.recharge_notes}`);
      }
    }

    lines.push("");
    lines.push(`Effect: ${nv(selected.mechanical_effect)}`);

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

    if (selected.narrative_notes) {
      lines.push("");
      lines.push("Notes:");
      lines.push(selected.narrative_notes);
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
              Items &amp; Gear Builder
            </GradientText>
            <p className="mt-2 text-sm text-zinc-300/90 max-w-2xl">
              Build lanterns, potions, rations, tools, and oddities. This window
              focuses on general gear &amp; consumables—clean categories now,
              deeper automation later in the Session Tracker.
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

      {/* Quick help strip */}
      <section className="max-w-7xl mx-auto mb-4">
        <Card className="bg-white/5 border border-white/10 rounded-3xl p-4 shadow-lg">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-zinc-200">
              How this window works
            </h2>
            <ol className="list-decimal pl-5 text-xs text-zinc-300 space-y-1">
              <li>
                Use the <span className="font-semibold">library</span> on the
                left to search and select items.
              </li>
              <li>
                Edit <span className="font-semibold">Basics</span> (category,
                subtype, cost, tags) in the center.
              </li>
              <li>
                Use <span className="font-semibold">System Hooks</span> to
                sketch how this item will behave later in the Session Tracker
                (prototype, not yet saved to DB).
              </li>
              <li>
                The <span className="font-semibold">Preview</span> on the right
                shows what you can paste into docs or quick-reference sheets.
              </li>
            </ol>
          </div>
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
              Item Library
            </h2>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={createItem}
            >
              + New Item
            </Button>
          </div>

          <Input
            value={qtext}
            onChange={(e) => setQtext(e.target.value)}
            placeholder="Search items by name, category, or tags…"
          />

          <div className="mt-2 flex-1 min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 border-b border-white/10">
              <span>Items: {filteredItems.length}</span>
              <span className="uppercase tracking-wide text-[10px] text-zinc-500">
                Library
              </span>
            </div>

            <div className="max-h-[420px] overflow-auto">
              {loading ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">
                  Loading items…
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">
                  No items yet. Create your first one.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-left text-zinc-400">
                    <tr>
                      <th className="px-3 py-1">Name</th>
                      <th className="px-3 py-1">Category</th>
                      <th className="px-3 py-1">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((r) => {
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

          {/* Admin-only batch uploader */}
          {isAdmin && (
            <div className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-300/5 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-amber-100">
                  Admin · Batch Upload
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={handleParseBatch}
                  >
                    Parse preview
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    onClick={handleCommitBatch}
                    disabled={!batchPreview.length || batchUploading}
                  >
                    {batchUploading ? "Uploading…" : "Commit to DB"}
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-amber-100/80">
                Paste tab-separated rows from your sheet. First row must be
                headers (Item Name, Timeline Tag, Cost (Credits), Category, Subtype, 
                Genre Tags, Mechanical Effect, Weight, Narrative/Variant Notes).
                Existing items are matched by name (case-insensitive).
              </p>
              <textarea
                className="w-full h-32 rounded-lg border border-white/15 bg-black/60 p-2 text-xs text-zinc-100 font-mono"
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder="Item Name	Timeline Tag	Cost (Credits)	Category	Subtype	Genre Tags	Mechanical Effect	Weight	Narrative/Variant Notes"
              />
              {batchError && (
                <p className="text-[11px] text-rose-300">
                  {batchError}
                </p>
              )}
              {batchPreview.length > 0 && !batchError && (
                <div className="text-[11px] text-amber-100/90">
                  Parsed{" "}
                  <span className="font-semibold">
                    {batchPreview.length}
                  </span>{" "}
                  items:&nbsp;
                  {batchPreview
                    .map((i) => i.name)
                    .slice(0, 5)
                    .join(", ")}
                  {batchPreview.length > 5 ? "…" : ""}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* MIDDLE: item editor */}
        <Card
          padded={false}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl"
        >
          {selected ? (
            <div className="space-y-4">
              {/* Name + save row */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1">
                  <FormField
                    label="Item Name"
                    htmlFor="item-name"
                    description="What your players will see in shops and character sheets."
                  >
                    <Input
                      id="item-name"
                      value={selected.name}
                      onChange={(e) =>
                        updateSelected({ name: e.target.value })
                      }
                    />
                  </FormField>
                </div>
                <div className="shrink-0 flex items-end gap-3">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.is_free ?? false}
                        onChange={(e) =>
                          updateSelected({ is_free: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-white/20 bg-black/30 text-violet-500 focus:ring-violet-500/50"
                      />
                      <span className="text-xs text-zinc-300">Share publicly</span>
                    </label>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    onClick={saveSelected}
                  >
                    Save Item
                  </Button>
                </div>
              </div>

              {/* Basics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Category"
                  htmlFor="item-category"
                  description="High-level grouping used for filters and shops."
                >
                  <select
                    id="item-category"
                    className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={selected.category ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        category: e.target.value || null,
                      })
                    }
                  >
                    <option value="">(unset)</option>
                    <option value="gear">General Gear</option>
                    <option value="tool">Tool / Kit</option>
                    <option value="consumable">Consumable</option>
                    <option value="focus">Spell Focus</option>
                    <option value="ammo">Ammunition</option>
                    <option value="service_token">Service Token</option>
                    <option value="pet_mount_item">Pet / Mount Gear</option>
                    <option value="other">Other</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label="Cost (Credits)" htmlFor="item-cost">
                  <Input
                    id="item-cost"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label="Weight" htmlFor="item-weight">
                  <Input
                    id="item-weight"
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

              {/* Tags with presets */}
              <FormField
                label="Genre Tags"
                htmlFor="item-tags"
                description="Comma- or space-separated tags. Use the chips to append quickly."
              >
                <div className="space-y-2">
                  <Input
                    id="item-tags"
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

              {/* Usage / charges */}
              <FormField
                label="Usage / Charges"
                htmlFor="item-usage"
                description="Is this a one-use consumable, a charged item, or something you can use freely?"
              >
                <div className="space-y-2">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {/* usage type */}
                    <select
                      className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-zinc-100"
                      value={selected.usage_type ?? "consumable"}
                      onChange={(e) =>
                        updateSelected({
                          usage_type: e.target.value as UsageType,
                        })
                      }
                    >
                      <option value="consumable">Consumable (one use)</option>
                      <option value="charges">Has charges</option>
                      <option value="at_will">At-will</option>
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

              {/* Mechanical effect */}
              <FormField
                label="Mechanical Effect"
                htmlFor="item-effect"
                description="What this does at the table: bonuses, checks, healing, special usage rules."
              >
                <textarea
                  id="item-effect"
                  className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                  value={selected.mechanical_effect ?? ""}
                  onChange={(e) =>
                    updateSelected({
                      mechanical_effect: e.target.value,
                    })
                  }
                />
              </FormField>

              {/* Narrative notes */}
              <FormField
                label="Flavor / Narrative Notes"
                htmlFor="item-notes"
                description="How it looks, feels, and fits into the lore."
              >
                <textarea
                  id="item-notes"
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
              No item selected. Create or select one from the library.
            </p>
          )}
        </Card>

        {/* RIGHT: system hooks + preview */}
        <div className="space-y-4">
          {/* System Hooks (local prototype) */}
          <Card className="rounded-3xl border border-emerald-400/30 bg-emerald-500/5 backdrop-blur p-4 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-emerald-100">
                  System Hooks (Prototype)
                </h2>
                <p className="text-[11px] text-emerald-200/70">
                  These are local-only sketches of how this item will behave
                  later in the Session Tracker. Not yet persisted to the DB.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                type="button"
                disabled={!selected}
                onClick={addHook}
              >
                + Add Hook
              </Button>
            </div>

            {!selected ? (
              <p className="text-xs text-emerald-200/70">
                Select an item to attach hooks to it.
              </p>
            ) : currentHooks.length === 0 ? (
              <p className="text-xs text-emerald-200/70">
                No hooks yet. Try something like{" "}
                <span className="italic">
                  “on_use → self → Restore 5 HP”
                </span>{" "}
                for a basic healing potion.
              </p>
            ) : (
              <div className="space-y-3">
                {currentHooks.map((hook) => (
                  <div
                    key={hook.id}
                    className="rounded-2xl border border-emerald-400/30 bg-emerald-500/5 px-3 py-2 flex flex-col gap-2"
                  >
                    <div className="flex flex-wrap gap-2">
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

                    <Input
                      className="w-full text-[11px]"
                      placeholder='e.g. "Restore 5 HP" or "Grant +1 to next attack roll"'
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
              </div>
            )}
          </Card>

          {/* Preview */}
          <Card className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-4 shadow-xl">
            <FormField
              label="Item Preview"
              htmlFor="item-preview"
              description="Copy-paste ready block for docs, handouts, or quick-reference."
            >
              <textarea
                id="item-preview"
                readOnly
                className="w-full h-[260px] rounded-lg border border-white/10 bg-neutral-950/70 px-3 py-2 text-xs text-zinc-200 font-mono"
                value={previewText}
              />
            </FormField>
          </Card>
        </div>
      </section>
    </main>
  );
}
