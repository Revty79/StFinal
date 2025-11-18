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
  current = "npcs",
}: {
  current?: "worlds" | "creatures" | "skillsets" | "races" | "inventory" | "npcs";
}) {
  const items = [
    { href: "/worldbuilder/worlds", key: "worlds", label: "Worlds" },
    { href: "/worldbuilder/creatures", key: "creatures", label: "Creatures" },
    { href: "/worldbuilder/skillsets", key: "skillsets", label: "Skillsets" },
    { href: "/worldbuilder/races", key: "races", label: "Races" },
    { href: "/worldbuilder/inventory", key: "inventory", label: "Inventory" },
    { href: "/worldbuilder/npcs", key: "npcs", label: "NPCs" },
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

type NPCTabKey = "identity" | "stats" | "skills" | "story" | "connections" | "preview";

type SimpleUser = {
  id: string;
  role: string | null;
};

export type NPC = {
  id: string | number;
  name: string;
  is_free?: boolean;

  // Identity & tags
  alias?: string | null;
  importance?: string | null; // Minion, Supporting, Major, Nemesis, etc.
  role?: string | null; // Archetype: merchant, warlord, guide, rival, etc.
  species?: string | null;
  occupation?: string | null;
  location?: string | null; // Current home/base
  timeline_tag?: string | null;
  tags?: string | null; // comma list: "city guard, black market"

  description_short?: string | null; // one-line pitch
  appearance?: string | null; // physical look, mannerisms

  // Stats (mirrors your core attributes)
  strength?: number | null;
  dexterity?: number | null;
  constitution?: number | null;
  intelligence?: number | null;
  wisdom?: number | null;
  charisma?: number | null;
  hp_total?: number | null;
  initiative?: number | null;
  armor_soak?: string | null;
  defense_notes?: string | null; // AC, resistances, notes

  // Story / personality
  personality?: string | null; // quick read on vibe
  ideals?: string | null;
  bonds?: string | null;
  flaws?: string | null;
  goals?: string | null;
  secrets?: string | null;
  backstory?: string | null;
  hooks?: string | null; // how to pull PCs into scenes

  // Connections & power
  faction?: string | null;
  relationships?: string | null; // who they care about
  attitude_toward_party?: string | null;
  resources?: string | null; // money, troops, contacts, gear

  notes?: string | null;

  // meta
  createdBy?: string | null;
  isPublished?: boolean;
};

const NPC_TABS: { id: NPCTabKey; label: string }[] = [
  { id: "identity", label: "Identity" },
  { id: "stats", label: "Stats" },
  { id: "skills", label: "Skills & Abilities" },
  { id: "story", label: "Story & Personality" },
  { id: "connections", label: "Connections & Power" },
  { id: "preview", label: "Preview" },
];

const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------- main page ---------- */

export default function NPCsPage() {
  const router = useRouter();

  // Escape -> back/fallback (same pattern as creatures)
  useEffect(() => {
    const onKey = (e: any) => {
      if (e.key === "Escape") {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/worldbuilder");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const [currentUser, setCurrentUser] = useState<SimpleUser | null>(null);

  // library data
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NPCTabKey>("identity");
  const [qtext, setQtext] = useState("");
  const [loading, setLoading] = useState(true);

  // Load NPCs from database on mount (mirrors creatures)
  useEffect(() => {
    async function loadNPCs() {
      try {
        // Load current user
        const userResponse = await fetch("/api/profile/me");
        const userData = await userResponse.json();
        if (userData.ok && userData.user) {
          setCurrentUser({ id: userData.user.id, role: userData.user.role });
        }

        const response = await fetch("/api/worldbuilder/npcs");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!data.ok) throw new Error(data.error || "Failed to load NPCs");

        // Assuming data.npcs is an array of DB rows shaped similarly to NPC type
        setNpcs(data.npcs || []);
      } catch (error) {
        console.error("Error loading NPCs:", error);
        alert(
          `Failed to load NPCs: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    }

    loadNPCs();
  }, []);

  const selected: NPC | null = useMemo(
    () =>
      npcs.find((c) => String(c.id) === String(selectedId ?? "")) ?? null,
    [npcs, selectedId]
  );

  // Ensure something is selected once we have data
  useEffect(() => {
    if (!selected && npcs.length) {
      const first = npcs[0];
      if (first) setSelectedId(String(first.id));
    }
  }, [npcs, selected]);

  const filteredList = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    if (!q) return npcs;
    return npcs.filter((c) => {
      const base = [
        c.name,
        c.alias ?? "",
        c.role ?? "",
        c.species ?? "",
        c.occupation ?? "",
        c.location ?? "",
        c.tags ?? "",
        c.importance ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return base.includes(q);
    });
  }, [npcs, qtext]);

  /* ---------- CRUD helpers ---------- */

  function createNPC() {
    const id = uid();
    const row: NPC = {
      id,
      name: "New NPC",
      is_free: true,
      alias: null,
      importance: null,
      role: null,
      species: null,
      occupation: null,
      location: null,
      timeline_tag: null,
      tags: null,
      description_short: null,
      appearance: null,
      strength: null,
      dexterity: null,
      constitution: null,
      intelligence: null,
      wisdom: null,
      charisma: null,
      hp_total: null,
      initiative: null,
      armor_soak: null,
      defense_notes: null,
      personality: null,
      ideals: null,
      bonds: null,
      flaws: null,
      goals: null,
      secrets: null,
      backstory: null,
      hooks: null,
      faction: null,
      relationships: null,
      attitude_toward_party: null,
      resources: null,
      notes: null,
      createdBy: currentUser?.id ?? null,
      isPublished: false,
    };
    setNpcs((prev) => [row, ...prev]);
    setSelectedId(String(id));
    setActiveTab("identity");
  }

  function updateSelected(patch: Partial<NPC>) {
    if (!selected) return;
    const idStr = String(selected.id);
    setNpcs((prev) =>
      prev.map((c) =>
        String(c.id) === idStr
          ? {
              ...c,
              ...patch,
            }
          : c
      )
    );
  }

  async function saveSelected() {
    if (!selected) return;

    const isNew =
      typeof selected.id === "string" && selected.id.length < 20; // uid()

    try {
      const payload = {
        name: selected.name,
        isFree: selected.is_free ?? true,

        alias: selected.alias,
        importance: selected.importance,
        role: selected.role,
        species: selected.species,
        occupation: selected.occupation,
        location: selected.location,
        timelineTag: selected.timeline_tag,
        tags: selected.tags,
        descriptionShort: selected.description_short,
        appearance: selected.appearance,

        strength: selected.strength,
        dexterity: selected.dexterity,
        constitution: selected.constitution,
        intelligence: selected.intelligence,
        wisdom: selected.wisdom,
        charisma: selected.charisma,
        hpTotal: selected.hp_total,
        initiative: selected.initiative,
        armorSoak: selected.armor_soak,
        defenseNotes: selected.defense_notes,

        personality: selected.personality,
        ideals: selected.ideals,
        bonds: selected.bonds,
        flaws: selected.flaws,
        goals: selected.goals,
        secrets: selected.secrets,
        backstory: selected.backstory,
        hooks: selected.hooks,

        faction: selected.faction,
        relationships: selected.relationships,
        attitudeTowardParty: selected.attitude_toward_party,
        resources: selected.resources,

        notes: selected.notes,
        isPublished: selected.isPublished ?? false,
      };

      let response: Response;
      if (isNew) {
        response = await fetch("/api/worldbuilder/npcs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`/api/worldbuilder/npcs/${selected.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to save NPC");
      }

      if (isNew && data.npc) {
        const oldId = selected.id;
        setNpcs((prev) =>
          prev.map((c) =>
            String(c.id) === String(oldId)
              ? {
                  ...data.npc,
                  is_free: data.npc.isFree,
                }
              : c
          )
        );
        setSelectedId(String(data.npc.id));
      } else if (data.npc) {
        setNpcs((prev) =>
          prev.map((c) =>
            String(c.id) === String(data.npc.id)
              ? { ...data.npc, is_free: data.npc.isFree }
              : c
          )
        );
      }

      alert("NPC saved successfully!");
    } catch (error) {
      console.error("Error saving NPC:", error);
      alert(
        `Failed to save NPC: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async function deleteSelected() {
    if (!selected || !currentUser) return;

    const idStr = String(selected.id);
    const isNew =
      typeof selected.id === "string" && selected.id.length < 20;

    const isAdmin =
      currentUser.role?.toLowerCase() === "admin";
    const isCreator = selected.createdBy === currentUser.id;

    if (!isNew && !isAdmin && !isCreator) {
      alert(
        "You can only delete NPCs you created. Admins can delete any NPC."
      );
      return;
    }

    if (!confirm("Delete this NPC?")) return;

    if (isNew) {
      setNpcs((prev) =>
        prev.filter((c) => String(c.id) !== idStr)
      );
      setSelectedId(null);
      return;
    }

    try {
      const response = await fetch(
        `/api/worldbuilder/npcs/${selected.id}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to delete NPC");
      }

      setNpcs((prev) =>
        prev.filter((c) => String(c.id) !== idStr)
      );
      setSelectedId(null);
    } catch (error) {
      console.error("Error deleting NPC:", error);
      alert(
        `Failed to delete NPC: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /* ---------- preview text ---------- */

  const previewText = useMemo(() => {
    if (!selected) return "";
    const n = selected;
    const nvLocal = (x: unknown) =>
      x === null || x === undefined || x === "" ? "—" : String(x);

    return [
      `NPC: ${n.name}`,
      `Alias: ${nvLocal(n.alias)}`,
      `Importance: ${nvLocal(n.importance)} | Role: ${nvLocal(
        n.role
      )}`,
      `Species: ${nvLocal(n.species)} | Occupation: ${nvLocal(
        n.occupation
      )}`,
      `Location: ${nvLocal(n.location)} | Timeline: ${nvLocal(
        n.timeline_tag
      )}`,
      `Tags: ${nvLocal(n.tags)}`,
      "",
      "— Quick Description —",
      `One-liner: ${nvLocal(n.description_short)}`,
      `Appearance: ${nvLocal(n.appearance)}`,
      "",
      "— Stats —",
      `STR: ${nvLocal(n.strength)}  DEX: ${nvLocal(
        n.dexterity
      )}  CON: ${nvLocal(n.constitution)}`,
      `INT: ${nvLocal(n.intelligence)}  WIS: ${nvLocal(
        n.wisdom
      )}  CHA: ${nvLocal(n.charisma)}`,
      `HP: ${nvLocal(n.hp_total)}  Init: ${nvLocal(
        n.initiative
      )}`,
      `Armor / Soak: ${nvLocal(n.armor_soak)}`,
      `Defense Notes: ${nvLocal(n.defense_notes)}`,
      "",
      "— Personality & Story —",
      `Personality: ${nvLocal(n.personality)}`,
      `Ideals: ${nvLocal(n.ideals)}`,
      `Bonds: ${nvLocal(n.bonds)}`,
      `Flaws: ${nvLocal(n.flaws)}`,
      `Goals: ${nvLocal(n.goals)}`,
      `Secrets: ${nvLocal(n.secrets)}`,
      "",
      "Backstory:",
      nvLocal(n.backstory),
      "",
      "Hooks:",
      nvLocal(n.hooks),
      "",
      "— Connections & Power —",
      `Faction: ${nvLocal(n.faction)}`,
      `Relationships: ${nvLocal(n.relationships)}`,
      `Attitude toward party: ${nvLocal(
        n.attitude_toward_party
      )}`,
      `Resources: ${nvLocal(n.resources)}`,
      "",
      "Notes:",
      nvLocal(n.notes),
    ].join("\n");
  }, [selected]);

  /* ---------- render ---------- */

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-4">
          <WBNav current="npcs" />
          <div className="flex flex-col gap-2">
            <GradientText
              as="h1"
              variant="title"
              glow
              className="font-evanescent text-3xl sm:text-4xl tracking-tight"
            >
              NPC Builder
            </GradientText>
            <p className="text-sm text-zinc-300/90 max-w-2xl">
              Create reusable NPCs for your worlds, eras, and campaigns.
              This tool focuses on fast identity, clean stats, and sharp
              story hooks, so your GM brain can stay in G.O.D mode.
            </p>
          </div>
        </header>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <FormField label="Search NPCs" htmlFor="npc-search">
                <Input
                  id="npc-search"
                  placeholder="Search by name, role, species, tags..."
                  value={qtext}
                  onChange={(e) => setQtext(e.target.value)}
                />
              </FormField>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={createNPC}
              >
                + New NPC
              </Button>
            </div>
          </div>

          <Card className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-4 sm:p-5 shadow-2xl">
            <div className="grid gap-4 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
              {/* LEFT: list */}
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Library
                </p>
                <Card className="rounded-2xl border border-white/10 bg-black/30 max-h-[520px] overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-sm text-zinc-400">
                      Loading NPCs...
                    </div>
                  ) : filteredList.length === 0 ? (
                    <div className="p-4 text-sm text-zinc-400">
                      No NPCs found. Create one to get started.
                    </div>
                  ) : (
                    <ul className="divide-y divide-white/5">
                      {filteredList.map((n) => {
                        const active =
                          String(n.id) === String(selectedId ?? "");
                        return (
                          <li
                            key={n.id}
                            className={[
                              "cursor-pointer px-3 py-2 text-sm",
                              active
                                ? "bg-violet-500/20 text-violet-50"
                                : "hover:bg-white/5 text-zinc-100",
                            ].join(" ")}
                            onClick={() => setSelectedId(String(n.id))}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-medium truncate">
                                  {n.name}
                                </p>
                                <p className="text-[11px] text-zinc-400 truncate">
                                  {n.role ?? "—"} •{" "}
                                  {n.location ?? n.species ?? "—"}
                                </p>
                              </div>
                              {n.importance && (
                                <span className="ml-2 inline-flex items-center rounded-full border border-violet-400/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-violet-200">
                                  {n.importance}
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              </div>

              {/* RIGHT: editor */}
              <Card className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 sm:p-5">
                {loading ? (
                  <p className="text-sm text-zinc-400">
                    Loading NPCs...
                  </p>
                ) : !selected ? (
                  <p className="text-sm text-zinc-400">
                    Select an NPC on the left or create a new one to
                    begin editing.
                  </p>
                ) : (
                  <>
                    <div className="mb-4 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex-1">
                        <Input
                          value={selected.name}
                          onChange={(e) =>
                            updateSelected({ name: e.target.value })
                          }
                          placeholder="NPC name (e.g., Captain Rhea Voss, Old Man Harlan...)"
                        />
                        <p className="mt-1 text-[11px] text-zinc-400">
                          This is the label you&apos;ll see everywhere in
                          the tools.
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected.is_free ?? true}
                              onChange={(e) =>
                                updateSelected({
                                  is_free: e.target.checked,
                                })
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
                          tabs={NPC_TABS}
                          activeId={activeTab}
                          onChange={(id) =>
                            setActiveTab(id as NPCTabKey)
                          }
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={deleteSelected}
                          >
                            Delete
                          </Button>
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
                      {/* IDENTITY */}
                      {activeTab === "identity" && (
                        <div className="space-y-4">
                          <FormField
                            label="Alias / Nickname"
                            htmlFor="npc-alias"
                          >
                            <Input
                              id="npc-alias"
                              value={selected.alias ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  alias: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <div className="grid gap-3 md:grid-cols-2">
                            <FormField
                              label="Importance"
                              htmlFor="npc-importance"
                              description="Minion, Supporting, Major, Nemesis..."
                            >
                              <Input
                                id="npc-importance"
                                value={selected.importance ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    importance: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                            <FormField
                              label="Role / Archetype"
                              htmlFor="npc-role"
                              description="Guard captain, fence, warlord, mentor, rival..."
                            >
                              <Input
                                id="npc-role"
                                value={selected.role ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    role: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            <FormField
                              label="Species / Ancestry"
                              htmlFor="npc-species"
                            >
                              <Input
                                id="npc-species"
                                value={selected.species ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    species: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                            <FormField
                              label="Occupation"
                              htmlFor="npc-occupation"
                            >
                              <Input
                                id="npc-occupation"
                                value={selected.occupation ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    occupation: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            <FormField
                              label="Primary Location"
                              htmlFor="npc-location"
                              description="City, region, stronghold, station..."
                            >
                              <Input
                                id="npc-location"
                                value={selected.location ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    location: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                            <FormField
                              label="Timeline Tag"
                              htmlFor="npc-timeline"
                              description="Era / arc label this NPC belongs to."
                            >
                              <Input
                                id="npc-timeline"
                                value={selected.timeline_tag ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    timeline_tag: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                          </div>

                          <FormField
                            label="Tags"
                            htmlFor="npc-tags"
                            description="Comma-separated: city guard, black market, noble, etc."
                          >
                            <Input
                              id="npc-tags"
                              value={selected.tags ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  tags: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <FormField
                            label="One-line Description"
                            htmlFor="npc-desc-short"
                          >
                            <textarea
                              id="npc-desc-short"
                              value={selected.description_short ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  description_short: e.target.value,
                                })
                              }
                              className="w-full min-h-[72px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                            />
                          </FormField>

                          <FormField
                            label="Appearance & Mannerisms"
                            htmlFor="npc-appearance"
                          >
                            <textarea
                              id="npc-appearance"
                              value={selected.appearance ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  appearance: e.target.value,
                                })
                              }
                              className="w-full min-h-[120px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                            />
                          </FormField>
                        </div>
                      )}

                      {/* STATS */}
                      {activeTab === "stats" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {(
                              [
                                ["STR", "strength"],
                                ["DEX", "dexterity"],
                                ["CON", "constitution"],
                                ["INT", "intelligence"],
                                ["WIS", "wisdom"],
                                ["CHA", "charisma"],
                              ] as const
                            ).map(([label, key]) => (
                              <FormField key={key} label={label} htmlFor={`npc-${key}`}>
                                <Input
                                  id={`npc-${key}`}
                                  type="number"
                                  value={
                                    (selected as any)[key] ?? ""
                                  }
                                  onChange={(e) =>
                                    updateSelected({
                                      [key]:
                                        e.target.value === ""
                                          ? null
                                          : Number(e.target.value),
                                    } as any)
                                  }
                                />
                              </FormField>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <FormField label="HP Total" htmlFor="npc-hp-total">
                              <Input
                                id="npc-hp-total"
                                type="number"
                                value={selected.hp_total ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    hp_total:
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value),
                                  })
                                }
                              />
                            </FormField>
                            <FormField label="Initiative" htmlFor="npc-initiative">
                              <Input
                                id="npc-initiative"
                                type="number"
                                value={selected.initiative ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    initiative:
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value),
                                  })
                                }
                              />
                            </FormField>
                            <FormField
                              label="Armor / Soak"
                              htmlFor="npc-armor-soak"
                              description="Armor rating, soak, shield, etc."
                            >
                              <Input
                                id="npc-armor-soak"
                                value={selected.armor_soak ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    armor_soak: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                          </div>

                          <FormField
                            label="Defense Notes"
                            htmlFor="npc-defense-notes"
                            description="Resistances, vulnerabilities, special defenses."
                          >
                            <textarea
                              id="npc-defense-notes"
                              value={selected.defense_notes ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  defense_notes: e.target.value,
                                })
                              }
                              className="w-full min-h-[120px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                            />
                          </FormField>
                        </div>
                      )}

                      {/* SKILLS & ABILITIES */}
                      {activeTab === "skills" && (
                        <div className="space-y-4">
                          <Card className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-6">
                            <div className="text-center space-y-3">
                              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-2">
                                <svg
                                  className="w-8 h-8 text-amber-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                  />
                                </svg>
                              </div>
                              <h3 className="text-lg font-semibold text-amber-200">
                                Skills & Abilities Assignment
                              </h3>
                              <p className="text-sm text-zinc-300 max-w-md mx-auto">
                                This powerful feature will allow you to assign skills, spells, 
                                special abilities, and disciplines to your NPCs. We'll be building 
                                this out once the skill library is fully populated.
                              </p>
                              <div className="pt-2">
                                <span className="inline-block px-4 py-2 rounded-full bg-violet-500/20 border border-violet-400/40 text-violet-200 text-xs font-medium">
                                  Coming Soon
                                </span>
                              </div>
                            </div>
                          </Card>

                          <div className="text-xs text-zinc-400 space-y-2">
                            <p className="font-medium text-zinc-300">Planned Features:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                              <li>Assign skills from your skill library</li>
                              <li>Add special abilities and racial traits</li>
                              <li>Configure spell lists and magic disciplines</li>
                              <li>Set proficiency levels and modifiers</li>
                              <li>Quick-add common ability packages</li>
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* STORY */}
                      {activeTab === "story" && (
                        <div className="space-y-4">
                          <FormField
                            label="Personality Summary"
                            htmlFor="npc-personality"
                          >
                            <textarea
                              id="npc-personality"
                              value={selected.personality ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  personality: e.target.value,
                                })
                              }
                              className="w-full min-h-[100px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                            />
                          </FormField>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <FormField
                              label="Ideals"
                              htmlFor="npc-ideals"
                            >
                              <textarea
                                id="npc-ideals"
                                value={selected.ideals ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    ideals: e.target.value,
                                  })
                                }
                                className="w-full min-h-[80px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              />
                            </FormField>
                            <FormField
                              label="Bonds"
                              htmlFor="npc-bonds"
                            >
                              <textarea
                                id="npc-bonds"
                                value={selected.bonds ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    bonds: e.target.value,
                                  })
                                }
                                className="w-full min-h-[80px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              />
                            </FormField>
                            <FormField
                              label="Flaws"
                              htmlFor="npc-flaws"
                            >
                              <textarea
                                id="npc-flaws"
                                value={selected.flaws ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    flaws: e.target.value,
                                  })
                                }
                                className="w-full min-h-[80px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              />
                            </FormField>
                          </div>

                          <FormField
                            label="Goals"
                            htmlFor="npc-goals"
                            description="What are they actively trying to achieve?"
                          >
                            <textarea
                              id="npc-goals"
                              value={selected.goals ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  goals: e.target.value,
                                })
                              }
                              className="w-full min-h-[80px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                            />
                          </FormField>

                          <FormField
                            label="Secrets"
                            htmlFor="npc-secrets"
                            description="Things they hide from others (or themselves)."
                          >
                            <textarea
                              id="npc-secrets"
                              value={selected.secrets ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  secrets: e.target.value,
                                })
                              }
                              className="w-full min-h-[80px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                            />
                          </FormField>

                          <FormField
                            label="Backstory"
                            htmlFor="npc-backstory"
                          >
                            <textarea
                              id="npc-backstory"
                              value={selected.backstory ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  backstory: e.target.value,
                                })
                              }
                              className="w-full min-h-[160px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                            />
                          </FormField>

                          <FormField
                            label="Story Hooks"
                            htmlFor="npc-hooks"
                            description="Ways to bring this NPC on-screen and entangle the PCs."
                          >
                            <textarea
                              id="npc-hooks"
                              value={selected.hooks ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  hooks: e.target.value,
                                })
                              }
                              className="w-full min-h-[120px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                            />
                          </FormField>
                        </div>
                      )}

                      {/* CONNECTIONS */}
                      {activeTab === "connections" && (
                        <div className="space-y-4">
                          <FormField
                            label="Faction / Organization"
                            htmlFor="npc-faction"
                          >
                            <Input
                              id="npc-faction"
                              value={selected.faction ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  faction: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <FormField
                            label="Relationships"
                            htmlFor="npc-relationships"
                            description="Family, allies, enemies, protégés, rivals..."
                          >
                            <textarea
                              id="npc-relationships"
                              value={selected.relationships ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  relationships: e.target.value,
                                })
                              }
                              className="w-full min-h-[120px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                            />
                          </FormField>

                          <FormField
                            label="Attitude Toward Party"
                            htmlFor="npc-attitude-party"
                          >
                            <textarea
                              id="npc-attitude-party"
                              value={selected.attitude_toward_party ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  attitude_toward_party:
                                    e.target.value,
                                })
                              }
                              className="w-full min-h-[80px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                            />
                          </FormField>

                          <FormField
                            label="Resources / Assets"
                            htmlFor="npc-resources"
                            description="What muscle, money, information, or arcane tech they can bring to bear."
                          >
                            <textarea
                              id="npc-resources"
                              value={selected.resources ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  resources: e.target.value,
                                })
                              }
                              className="w-full min-h-[120px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                            />
                          </FormField>

                          <FormField
                            label="GM Notes"
                            htmlFor="npc-notes"
                          >
                            <textarea
                              id="npc-notes"
                              value={selected.notes ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  notes: e.target.value,
                                })
                              }
                              className="w-full min-h-[120px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                            />
                          </FormField>
                        </div>
                      )}

                      {/* PREVIEW */}
                      {activeTab === "preview" && (
                        <div className="space-y-3">
                          <p className="text-xs text-zinc-400">
                            Copy-paste friendly NPC summary for docs or
                            notes:
                          </p>
                          <textarea
                            readOnly
                            value={previewText}
                            className="w-full min-h-[260px] rounded-xl border border-white/10 bg-neutral-950/60 px-3 py-2 text-xs font-mono text-zinc-100"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Card>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
