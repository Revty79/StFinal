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

type UsageType = "consumable" | "charges" | "at_will" | "other" | null;
type RechargeWindow = "none" | "scene" | "session" | "rest" | "day" | "custom" | null;
type ItemHookTrigger = "on_use" | "on_equip" | "passive" | "other";
type ItemHookTarget = "self" | "ally" | "enemy" | "area" | "other";
type ItemHookKind = "heal" | "damage" | "buff" | "debuff" | "utility" | "other";

interface ItemHook {
  trigger: ItemHookTrigger;
  target: ItemHookTarget;
  kind: ItemHookKind;
  amount: number | null;
  label: string;
}

type ShopRole = "loot_only" | "shop_stock" | "exclusive" | null;

export type ServiceRow = {
  id: string | number;
  name: string;

  is_free?: boolean;
  createdBy?: string;

  timeline_tag?: string | null;
  cost_credits?: number | null;

  category?: string | null; // travel, lodging, healing, etc
  duration?: string | null;
  genre_tags?: string | null;

  mechanical_effect?: string | null;
  weight?: number | null; // usually null
  narrative_notes?: string | null;

  usage_type?: UsageType;
  max_charges?: number | null;
  recharge_window?: RechargeWindow;
  recharge_notes?: string | null;
  effect_hooks?: ItemHook[] | null;

  shop_ready?: boolean;
  shop_role?: ShopRole;
};

const uid = () => Math.random().toString(36).slice(2, 10);
const nv = (x: unknown) =>
  x === null || x === undefined || x === "" ? "—" : String(x);

// Genre tag presets matching campaign shop genres
const GENRE_PRESETS = [
  "High Fantasy",
  "Low Fantasy",
  "Dark Fantasy",
  "Urban Fantasy",
  "Epic Fantasy",
  "Sword & Sorcery",
  "Grimdark",
  "Post-Apocalyptic",
  "Cyberpunk",
  "Steampunk",
  "Dieselpunk",
  "Space Opera",
  "Hard Sci-Fi",
  "Soft Sci-Fi",
  "Horror",
  "Gothic Horror",
  "Cosmic Horror",
  "Supernatural",
  "Historical",
  "Alternate History",
  "Modern Day",
  "Western",
  "Noir",
  "Pulp Adventure",
  "Superhero",
  "Mystery",
  "Thriller",
  "Survival",
  "Military",
  "Political Intrigue",
] as const;

/* ---------- main page ---------- */

export default function InventoryServicesPage() {
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

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [qtext, setQtext] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hooksByItem, setHooksByItem] = useState<Record<string, ItemHook[]>>({});
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    async function loadServices() {
      try {
        const userRes = await fetch("/api/profile/me");
        const userData = await userRes.json();
        if (userData.ok && userData.user) {
          setCurrentUser({ id: userData.user.id, role: userData.user.role });
        }

        const res = await fetch("/api/worldbuilder/inventory/services");
        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error || "Failed to load services");
        }

        const mapped: ServiceRow[] = (data.services || []).map((s: any) => ({
          ...s,
          is_free: s.isFree,
          shop_ready: s.shopReady,
          shop_role: s.shopRole ?? null,
          usage_type: s.usageType ?? null,
          max_charges: s.maxCharges ?? null,
          recharge_window: s.rechargeWindow ?? null,
          recharge_notes: s.rechargeNotes ?? null,
          effect_hooks: s.effectHooks ?? null,
        }));

        setServices(mapped);
        
        // Seed hooksByItem from effect_hooks
        const hooksMap: Record<string, ItemHook[]> = {};
        for (const svc of mapped) {
          if (svc.effect_hooks && Array.isArray(svc.effect_hooks)) {
            hooksMap[String(svc.id)] = svc.effect_hooks;
          }
        }
        setHooksByItem(hooksMap);
        
        if (mapped.length > 0 && mapped[0]) {
          setSelectedId(String(mapped[0].id));
        }
      } catch (err) {
        console.error("Error loading services:", err);
        alert(
          `Failed to load services: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    }

    loadServices();
  }, []);

  const filteredServices = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    if (!q) return services;
    return services.filter((r) => {
      const base = [
        r.name,
        r.category ?? "",
        r.duration ?? "",
        r.genre_tags ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return base.includes(q);
    });
  }, [services, qtext]);

  const selected: ServiceRow | null = useMemo(
    () =>
      filteredServices.find((r) => String(r.id) === String(selectedId ?? "")) ??
      null,
    [filteredServices, selectedId]
  );

  useEffect(() => {
    if (!filteredServices.length) {
      setSelectedId(null);
      return;
    }
    if (!selected && filteredServices[0]) {
      setSelectedId(String(filteredServices[0].id));
    }
  }, [filteredServices, selected]);

  /* ---------- helpers ---------- */

  function createService() {
    const id = uid();
    const row: ServiceRow = {
      id,
      name: "New Service",
      is_free: false,
      shop_ready: true,
      shop_role: "shop_stock",
      timeline_tag: null,
      cost_credits: null,
      category: "",
      duration: "",
      genre_tags: "",
      mechanical_effect: "",
      weight: null,
      narrative_notes: "",
    };
    setServices((prev) => [row, ...prev]);
    setSelectedId(id);
  }

  async function deleteSelected() {
    if (!selected || !currentUser) return;
    const idStr = String(selected.id);

    const isNew = typeof selected.id === "string" && selected.id.length < 20;
    const isAdmin = currentUser.role?.toLowerCase() === "admin";
    const isCreator = selected.createdBy === currentUser.id;

    if (!isNew && !isAdmin && !isCreator) {
      alert("You can only delete services you created (admins can delete any).");
      return;
    }

    if (!confirm("Delete this service from the inventory?")) return;

    const removeFromState = () => {
      setServices((prev) => prev.filter((r) => String(r.id) !== idStr));
    };

    if (isNew) {
      removeFromState();
      setSelectedId(null);
      return;
    }

    try {
      const res = await fetch(
        `/api/worldbuilder/inventory/services/${selected.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to delete service");
      }
      removeFromState();
      setSelectedId(null);
      alert("Service deleted.");
    } catch (err) {
      console.error("Error deleting service:", err);
      alert(
        `Failed to delete service: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }

  function renameSelected(newName: string) {
    if (!selected) return;
    const idStr = String(selected.id);
    setServices((prev) =>
      prev.map((r) => (String(r.id) === idStr ? { ...r, name: newName } : r))
    );
  }

  function updateSelected(patch: Partial<ServiceRow>) {
    if (!selected) return;
    const idStr = String(selected.id);
    setServices((prev) =>
      prev.map((r) =>
        String(r.id) === idStr ? ({ ...r, ...patch } as ServiceRow) : r
      )
    );
  }

  async function saveSelected() {
    if (!selected) return;

    try {
      const isNew = typeof selected.id === "string" && selected.id.length < 20;

      const currentHooks = hooksByItem[String(selected.id)] || [];
      
      const payload: any = {
        name: selected.name,
        isFree: selected.is_free ?? false,
        shopReady: selected.shop_ready ?? true,
        shopRole: selected.shop_role ?? "shop_stock",
        timelineTag: selected.timeline_tag ?? null,
        costCredits: selected.cost_credits ?? null,
        category: selected.category ?? null,
        duration: selected.duration ?? null,
        genreTags: selected.genre_tags ?? null,
        mechanicalEffect: selected.mechanical_effect ?? null,
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
        res = await fetch("/api/worldbuilder/inventory/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(
          `/api/worldbuilder/inventory/services/${selected.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to save service");
      }

      if (isNew) {
        const oldId = selected.id;
        const saved = data.service;
        if (saved) {
          const transformed: ServiceRow = {
            ...saved,
            is_free: saved.isFree,
            shop_ready: saved.shopReady,
            shop_role: saved.shopRole ?? null,
          };
          setServices((prev) =>
            prev.map((r) =>
              String(r.id) === String(oldId) ? transformed : r
            )
          );
          setSelectedId(String(saved.id));
        }
      }

      alert("Service saved.");
    } catch (err) {
      console.error("Error saving service:", err);
      alert(
        `Failed to save service: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }

  function appendGenreTag(tag: string) {
    if (!selected) return;
    const current = selected.genre_tags ?? "";
    const bits = current
      .split(/,/)
      .map((b) => b.trim())
      .filter(Boolean);
    if (bits.includes(tag)) return;
    const next = [...bits, tag].join(", ");
    updateSelected({ genre_tags: next });
  }

  // Hook management functions
  function addHook() {
    if (!selected) return;
    const idStr = String(selected.id);
    const newHook: ItemHook = {
      trigger: "on_use",
      target: "self",
      kind: "utility",
      amount: null,
      label: "",
    };
    setHooksByItem((prev) => ({
      ...prev,
      [idStr]: [...(prev[idStr] || []), newHook],
    }));
  }

  function updateHook(index: number, patch: Partial<ItemHook>) {
    if (!selected) return;
    const idStr = String(selected.id);
    const hooks = hooksByItem[idStr] || [];
    const updated = hooks.map((h, i) => (i === index ? { ...h, ...patch } : h));
    setHooksByItem((prev) => ({ ...prev, [idStr]: updated }));
  }

  function removeHook(index: number) {
    if (!selected) return;
    const idStr = String(selected.id);
    const hooks = hooksByItem[idStr] || [];
    const updated = hooks.filter((_, i) => i !== index);
    setHooksByItem((prev) => ({ ...prev, [idStr]: updated }));
  }

  const currentHooks = useMemo(() => {
    if (!selected) return [];
    return hooksByItem[String(selected.id)] || [];
  }, [selected, hooksByItem]);

  const previewText = useMemo(() => {
    if (!selected) return "";
    const s = selected;
    const lines: string[] = [];

    lines.push(`Service: ${s.name}`);
    lines.push(
      `Category: ${nv(s.category)}   Duration / Scope: ${nv(s.duration)}`
    );
    lines.push(
      `Timeline: ${nv(s.timeline_tag)}   Cost: ${nv(
        s.cost_credits
      )}   Weight: ${nv(s.weight)}`
    );
    lines.push(`Tags: ${nv(s.genre_tags)}`);
    
    // Usage summary
    if (s.usage_type) {
      lines.push("");
      if (s.usage_type === "consumable") {
        lines.push("Usage: Consumable (single use)");
      } else if (s.usage_type === "charges" && s.max_charges) {
        const recharge = s.recharge_window || "none";
        lines.push(`Usage: ${s.max_charges} charges (recharge: ${recharge})`);
        if (s.recharge_notes) {
          lines.push(`  Recharge Notes: ${s.recharge_notes}`);
        }
      } else if (s.usage_type === "at_will") {
        lines.push("Usage: At-will (unlimited)");
      } else {
        lines.push(`Usage: ${s.usage_type}`);
      }
    }
    
    lines.push("");
    lines.push(`Effect: ${nv(s.mechanical_effect)}`);
    
    // Effect hooks
    if (currentHooks.length > 0) {
      lines.push("");
      lines.push("System Hooks:");
      currentHooks.forEach((hook, i) => {
        const kindPart = hook.amount ? `${hook.kind} ${hook.amount}` : hook.kind;
        lines.push(`  ${i + 1}. [${hook.trigger}] ${kindPart} → ${hook.target}: ${hook.label || "(no label)"}`);
      });
    }
    
    if (s.narrative_notes) {
      lines.push("");
      lines.push("Notes:");
      lines.push(s.narrative_notes);
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
              Services Builder
            </GradientText>
            <p className="mt-2 text-sm text-zinc-300/90 max-w-2xl">
              Travel, lodgings, spellcasting, crafting, information brokering—
              anything you pay people to do in-world. This window defines what
              a service guarantees at the table.
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
            <li>
              Use the library on the left to search and select services (inn
              stay, portal ride, ritual casting, etc.).
            </li>
            <li>
              Define cost, duration, and mechanical guarantees in the editor.
            </li>
            <li>
              Use the preview on the right whenever this service appears in
              shops, contracts, or downtime menus.
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
              Services Library
            </h2>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={createService}
            >
              + New Service
            </Button>
          </div>

          <Input
            value={qtext}
            onChange={(e) => setQtext(e.target.value)}
            placeholder="Search services by name, category, or tags…"
          />

          <div className="mt-2 flex-1 min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 border-b border-white/10">
              <span>Services: {filteredServices.length}</span>
              <span className="uppercase tracking-wide text-[10px] text-zinc-500">
                Library
              </span>
            </div>

            <div className="max-h-[420px] overflow-auto">
              {loading ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">
                  Loading services…
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">
                  No services yet. Define your first one.
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
                    {filteredServices.map((r) => {
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
                    label="Service Name"
                    htmlFor="service-name"
                    description="What appears on price lists and contracts."
                  >
                    <Input
                      id="service-name"
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
                    Save Service
                  </Button>
                </div>
              </div>

              {/* category/duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Service Category"
                  htmlFor="service-category"
                  description="Travel, lodging, healing, information, etc."
                >
                  <select
                    id="service-category"
                    className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={selected.category ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        category: e.target.value || null,
                      })
                    }
                  >
                    <option value="">(unset)</option>
                    <option value="travel">Travel</option>
                    <option value="lodging">Lodging</option>
                    <option value="healing">Healing</option>
                    <option value="information">Information</option>
                    <option value="crafting">Crafting</option>
                    <option value="magic_service">Magic / Ritual</option>
                    <option value="protection">Protection / Guard</option>
                    <option value="other">Other</option>
                  </select>
                </FormField>

                <FormField
                  label="Duration / Scope"
                  htmlFor="service-duration"
                  description="One night, per journey, per week, per casting, etc."
                >
                  <Input
                    id="service-duration"
                    value={selected.duration ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        duration: e.target.value,
                      })
                    }
                  />
                </FormField>
              </div>

              {/* timeline / cost */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField label="Timeline Tag" htmlFor="service-timeline">
                  <Input
                    id="service-timeline"
                    value={selected.timeline_tag ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        timeline_tag: e.target.value,
                      })
                    }
                  />
                </FormField>
                <FormField label="Cost (Credits)" htmlFor="service-cost">
                  <Input
                    id="service-cost"
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
                htmlFor="service-tags"
                description="Comma- or space-separated; use chips to append."
              >
                <div className="space-y-2">
                  <Input
                    id="service-tags"
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

              {/* weight (rare) */}
              <FormField
                label="Weight (optional)"
                htmlFor="service-weight"
                description="Only if you treat contracts or tokens as physical items."
              >
                <Input
                  id="service-weight"
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

              {/* mechanical effect */}
              <FormField
                label="Mechanical Effect"
                htmlFor="service-effect"
                description="What this service guarantees or unlocks mechanically."
              >
                <textarea
                  id="service-effect"
                  className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                  value={selected.mechanical_effect ?? ""}
                  onChange={(e) =>
                    updateSelected({
                      mechanical_effect: e.target.value,
                    })
                  }
                />
              </FormField>

              {/* notes */}
              <FormField
                label="Narrative Notes"
                htmlFor="service-notes"
                description="Who offers this, what it looks like, and what strings may be attached."
              >
                <textarea
                  id="service-notes"
                  className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                  value={selected.narrative_notes ?? ""}
                  onChange={(e) =>
                    updateSelected({
                      narrative_notes: e.target.value,
                    })
                  }
                />
              </FormField>

              {/* USAGE / CHARGES */}
              <FormField
                label="Usage / Charges"
                htmlFor="service-usage"
                description="How often can this service be used or purchased?"
              >
                <div className="space-y-3">
                  <select
                    id="service-usage"
                    className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={selected.usage_type ?? ""}
                    onChange={(e) =>
                      updateSelected({
                        usage_type: (e.target.value || null) as UsageType,
                      })
                    }
                  >
                    <option value="">(none)</option>
                    <option value="consumable">Consumable (single use)</option>
                    <option value="charges">Charges (reusable with limits)</option>
                    <option value="at_will">At-will (unlimited)</option>
                    <option value="other">Other</option>
                  </select>

                  {selected.usage_type === "charges" && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
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
                        <select
                          className="rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                          value={selected.recharge_window ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              recharge_window: (e.target.value ||
                                null) as RechargeWindow,
                            })
                          }
                        >
                          <option value="">(no recharge)</option>
                          <option value="none">None (permanent loss)</option>
                          <option value="scene">Per scene</option>
                          <option value="session">Per session</option>
                          <option value="rest">After rest</option>
                          <option value="day">Per day</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <Input
                        placeholder="Recharge notes (e.g., 'recharges at dawn')"
                        value={selected.recharge_notes ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            recharge_notes: e.target.value || null,
                          })
                        }
                      />
                    </>
                  )}
                </div>
              </FormField>

              {/* SYSTEM HOOKS */}
              <FormField
                label="System Hooks"
                htmlFor="service-hooks"
                description="Structured effects for future automation (healing, damage, buffs, etc.)"
              >
                <div className="space-y-3">
                  {currentHooks.map((hook, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-white/10 bg-black/20 space-y-2"
                    >
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          className="rounded-lg border border-white/10 bg-neutral-950/50 px-2 py-1 text-xs text-zinc-100"
                          value={hook.trigger}
                          onChange={(e) =>
                            updateHook(idx, {
                              trigger: e.target
                                .value as ItemHookTrigger,
                            })
                          }
                        >
                          <option value="on_use">On Use</option>
                          <option value="on_equip">On Equip</option>
                          <option value="passive">Passive</option>
                          <option value="other">Other</option>
                        </select>
                        <select
                          className="rounded-lg border border-white/10 bg-neutral-950/50 px-2 py-1 text-xs text-zinc-100"
                          value={hook.kind}
                          onChange={(e) =>
                            updateHook(idx, {
                              kind: e.target.value as ItemHookKind,
                            })
                          }
                        >
                          <option value="heal">Heal</option>
                          <option value="damage">Damage</option>
                          <option value="buff">Buff</option>
                          <option value="debuff">Debuff</option>
                          <option value="utility">Utility</option>
                          <option value="other">Other</option>
                        </select>
                        <select
                          className="rounded-lg border border-white/10 bg-neutral-950/50 px-2 py-1 text-xs text-zinc-100"
                          value={hook.target}
                          onChange={(e) =>
                            updateHook(idx, {
                              target: e.target.value as ItemHookTarget,
                            })
                          }
                        >
                          <option value="self">Self</option>
                          <option value="ally">Ally</option>
                          <option value="enemy">Enemy</option>
                          <option value="area">Area</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-[1fr,auto,auto] gap-2">
                        <Input
                          placeholder="Effect label (e.g., 'restore health')"
                          value={hook.label}
                          onChange={(e) =>
                            updateHook(idx, { label: e.target.value })
                          }
                        />
                        <Input
                          type="number"
                          placeholder="Amount"
                          className="w-20"
                          value={hook.amount ?? ""}
                          onChange={(e) =>
                            updateHook(idx, {
                              amount:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => removeHook(idx)}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={addHook}
                  >
                    + Add Hook
                  </Button>
                </div>
              </FormField>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">
              No service selected. Create or select one from the library.
            </p>
          )}
        </Card>

        {/* RIGHT: preview */}
        <Card className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-4 shadow-xl">
          <FormField
            label="Service Preview"
            htmlFor="service-preview"
            description="Copy-paste ready block for shops, contracts, and downtime menus."
          >
            <textarea
              id="service-preview"
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
