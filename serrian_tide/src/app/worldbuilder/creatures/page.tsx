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
import { WBNav } from "@/components/worldbuilder/WBNav";

/* ---------- types & helpers ---------- */

type CreatureTabKey = "identity" | "stats" | "combat" | "behavior" | "preview";

export type Creature = {
  id: string | number;
  name: string;
  is_free?: boolean;
  createdBy?: string;
  alt_names?: string | null;
  challenge_rating?: string | null;
  encounter_scale?: string | null;
  type?: string | null;
  role?: string | null;
  size?: string | null;
  genre_tags?: string | null;
  description_short?: string | null;
  strength?: number | null;
  dexterity?: number | null;
  constitution?: number | null;
  intelligence?: number | null;
  wisdom?: number | null;
  charisma?: number | null;
  hp_total?: number | null;
  initiative?: number | null;
  hp_by_location?: string | null;
  armor_soak?: string | null;
  attack_modes?: string | null;
  damage?: string | null;
  range_text?: string | null;
  special_abilities?: string | null;
  magic_resonance_interaction?: string | null;
  behavior_tactics?: string | null;
  habitat?: string | null;
  diet?: string | null;
  variants?: string | null;
  loot_harvest?: string | null;
  story_hooks?: string | null;
  notes?: string | null;

  // New: usage flags (mount / pet / companion)
  can_be_mount?: boolean | null;
  can_be_pet?: boolean | null;
  can_be_companion?: boolean | null;
};

const CREATURE_TABS: { id: CreatureTabKey; label: string }[] = [
  { id: "identity", label: "Identity" },
  { id: "stats", label: "Stats" },
  { id: "combat", label: "Combat" },
  { id: "behavior", label: "Behavior & Lore" },
  { id: "preview", label: "Preview" },
];

const uid = () => Math.random().toString(36).slice(2, 10);
const nv = (x: unknown) =>
  x === null || x === undefined || x === "" ? "—" : String(x);

/* ---------- main page ---------- */

export default function CreaturesPage() {
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

  // library data
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CreatureTabKey>("identity");
  const [qtext, setQtext] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);

  // Load creatures from database on mount
  useEffect(() => {
    async function loadCreatures() {
      try {
        // Load current user
        const userResponse = await fetch("/api/profile/me");
        const userData = await userResponse.json();
        if (userData.ok && userData.user) {
          setCurrentUser({ id: userData.user.id, role: userData.user.role });
        }

        const response = await fetch("/api/worldbuilder/creatures");
        const data = await response.json();

        if (!data.ok) {
          throw new Error(data.error || "Failed to load creatures");
        }

        setCreatures((data.creatures || []).map((c: any) => ({
          ...c,
          is_free: c.isFree,
          can_be_mount: c.canBeMount,
          can_be_pet: c.canBePet,
          can_be_companion: c.canBeCompanion,
        })));
      } catch (error) {
        console.error("Error loading creatures:", error);
        alert(
          `Failed to load creatures: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    }

    loadCreatures();
  }, []);

  const selected: Creature | null = useMemo(
    () =>
      creatures.find((c) => String(c.id) === String(selectedId ?? "")) ?? null,
    [creatures, selectedId]
  );

  // ensure something is selected when list changes
  useEffect(() => {
    if (!creatures.length) {
      setSelectedId(null);
      return;
    }
    if (!selected) {
      const first = creatures[0];
      if (first) setSelectedId(String(first.id));
    }
  }, [creatures, selected]);

  const filteredList = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    if (!q) return creatures;
    return creatures.filter((c) => {
      const base = [
        c.name,
        c.type ?? "",
        c.role ?? "",
        c.genre_tags ?? "",
        c.challenge_rating ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return base.includes(q);
    });
  }, [creatures, qtext]);

  /* ---------- CRUD helpers (UI-only) ---------- */

  function createCreature() {
    const id = uid();
    const row: Creature = {
      id,
      name: "New Creature",
      is_free: false,
      alt_names: null,
      challenge_rating: null,
      encounter_scale: null,
      type: null,
      role: null,
      size: null,
      genre_tags: null,
      description_short: null,
      strength: null,
      dexterity: null,
      constitution: null,
      intelligence: null,
      wisdom: null,
      charisma: null,
      hp_total: null,
      initiative: null,
      hp_by_location: null,
      armor_soak: null,
      attack_modes: null,
      damage: null,
      range_text: null,
      special_abilities: null,
      magic_resonance_interaction: null,
      behavior_tactics: null,
      habitat: null,
      diet: null,
      variants: null,
      loot_harvest: null,
      story_hooks: null,
      notes: null,
      can_be_mount: false,
      can_be_pet: false,
      can_be_companion: false,
    };
    setCreatures((prev) => [row, ...prev]);
    setSelectedId(id);
  }

  async function deleteSelected() {
    if (!selected || !currentUser) return;

    const idStr = String(selected.id);
    const isNew = typeof selected.id === "string" && selected.id.length < 20;

    const isAdmin = currentUser.role?.toLowerCase() === "admin";
    const isCreator = selected.createdBy === currentUser.id;

    if (!isNew && !isAdmin && !isCreator) {
      alert("You can only delete creatures you created. Admins can delete any creature.");
      return;
    }

    if (!confirm("Delete this creature?")) return;

    if (isNew) {
      setCreatures((prev) => prev.filter((c) => String(c.id) !== idStr));
      setSelectedId(null);
      return;
    }

    try {
      const response = await fetch(`/api/worldbuilder/creatures/${selected.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to delete creature");
      }

      setCreatures((prev) => prev.filter((c) => String(c.id) !== idStr));
      setSelectedId(null);
      alert("Creature deleted successfully!");
    } catch (error) {
      console.error("Error deleting creature:", error);
      alert(
        `Failed to delete creature: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  function renameSelected(newName: string) {
    if (!selected) return;
    const idStr = String(selected.id);
    setCreatures((prev) =>
      prev.map((c) =>
        String(c.id) === idStr ? ({ ...c, name: newName } as Creature) : c
      )
    );
  }

  function updateSelected(patch: Partial<Creature>) {
    if (!selected) return;
    const idStr = String(selected.id);
    setCreatures((prev) =>
      prev.map((c) =>
        String(c.id) === idStr ? ({ ...c, ...patch } as Creature) : c
      )
    );
  }

  async function saveSelected() {
    if (!selected) return;

    try {
      const payload = {
        name: selected.name,
        isFree: selected.is_free ?? false,
        altNames: selected.alt_names,
        challengeRating: selected.challenge_rating,
        encounterScale: selected.encounter_scale,
        type: selected.type,
        role: selected.role,
        size: selected.size,
        genreTags: selected.genre_tags,
        descriptionShort: selected.description_short,
        strength: selected.strength,
        dexterity: selected.dexterity,
        constitution: selected.constitution,
        intelligence: selected.intelligence,
        wisdom: selected.wisdom,
        charisma: selected.charisma,
        hpTotal: selected.hp_total,
        initiative: selected.initiative,
        hpByLocation: selected.hp_by_location,
        armorSoak: selected.armor_soak,
        attackModes: selected.attack_modes,
        damage: selected.damage,
        rangeText: selected.range_text,
        specialAbilities: selected.special_abilities,
        magicResonanceInteraction: selected.magic_resonance_interaction,
        behaviorTactics: selected.behavior_tactics,
        habitat: selected.habitat,
        diet: selected.diet,
        variants: selected.variants,
        lootHarvest: selected.loot_harvest,
        storyHooks: selected.story_hooks,
        notes: selected.notes,
        canBeMount: selected.can_be_mount ?? false,
        canBePet: selected.can_be_pet ?? false,
        canBeCompanion: selected.can_be_companion ?? false,
      };

      const isNew = typeof selected.id === "string" && selected.id.length < 20;

      let response;
      if (isNew) {
        response = await fetch("/api/worldbuilder/creatures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`/api/worldbuilder/creatures/${selected.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to save creature");
      }

      if (isNew && data.creature) {
        const oldId = selected.id;
        setCreatures((prev) =>
          prev.map((c) =>
            String(c.id) === String(oldId)
              ? { ...data.creature, is_free: data.creature.isFree }
              : c
          )
        );
        setSelectedId(data.creature.id);
      }

      alert("Creature saved successfully!");
    } catch (error) {
      console.error("Error saving creature:", error);
      alert(
        `Failed to save creature: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /* ---------- preview text ---------- */

  const previewText = useMemo(() => {
    if (!selected) return "";
    const c = selected;

    const nvLocal = (x: unknown) =>
      x === null || x === undefined || x === "" ? "—" : String(x);

    const usages: string[] = [];
    if (c.can_be_mount) usages.push("Mount");
    if (c.can_be_pet) usages.push("Pet");
    if (c.can_be_companion) usages.push("Companion");

    return [
      `Creature: ${c.name}`,
      `Alt Names: ${nvLocal(c.alt_names)}`,
      `CR / Scale / Type / Role: ${nvLocal(
        c.challenge_rating
      )} / ${nvLocal(c.encounter_scale)} / ${nvLocal(c.type)} / ${nvLocal(
        c.role
      )}`,
      `Size: ${nvLocal(c.size)}   Tags: ${nvLocal(c.genre_tags)}`,
      `Usage: ${usages.length ? usages.join(", ") : "—"}`,
      "",
      "— Description —",
      nvLocal(c.description_short),
      "",
      "— Stats —",
      `STR ${nvLocal(c.strength)}  DEX ${nvLocal(
        c.dexterity
      )}  CON ${nvLocal(c.constitution)}  INT ${nvLocal(
        c.intelligence
      )}  WIS ${nvLocal(c.wisdom)}  CHA ${nvLocal(c.charisma)}`,
      `HP ${nvLocal(c.hp_total)}   Initiative ${nvLocal(c.initiative)}`,
      `HP by Location: ${nvLocal(c.hp_by_location)}`,
      `Armor/Soak: ${nvLocal(c.armor_soak)}`,
      "",
      "— Combat —",
      `Attack Modes: ${nvLocal(c.attack_modes)}`,
      `Damage: ${nvLocal(c.damage)}`,
      `Range: ${nvLocal(c.range_text)}`,
      `Special Abilities: ${nvLocal(c.special_abilities)}`,
      `Magic/Resonance Interaction: ${nvLocal(
        c.magic_resonance_interaction
      )}`,
      "",
      "— Behavior & Lore —",
      `Behavior & Tactics: ${nvLocal(c.behavior_tactics)}`,
      `Habitat: ${nvLocal(c.habitat)}`,
      `Diet: ${nvLocal(c.diet)}`,
      `Variants: ${nvLocal(c.variants)}`,
      `Loot/Harvest: ${nvLocal(c.loot_harvest)}`,
      `Story Hooks: ${nvLocal(c.story_hooks)}`,
      `Notes: ${nvLocal(c.notes)}`,
    ].join("\n");
  }, [selected]);

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
              The Source Forge — Creatures
            </GradientText>
            <p className="mt-1 text-sm text-zinc-300/90 max-w-2xl">
              Design monsters, beasts, mounts, pets, and companions your worlds,
              eras, and campaigns can adopt.
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
          <WBNav current="creatures" />
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
              Creature Library
            </h2>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={createCreature}
            >
              + New Creature
            </Button>
          </div>

          {/* Filter */}
          <div className="space-y-2">
            <Input
              value={qtext}
              onChange={(e) => setQtext(e.target.value)}
              placeholder="Search creatures by name, type, role, tags…"
            />
          </div>

          {/* List */}
          <div className="mt-2 flex-1 min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 border-b border-white/10">
              <span>Creatures: {filteredList.length}</span>
              <span className="uppercase tracking-wide text-[10px] text-zinc-500">
                Creature records
              </span>
            </div>

            <div className="max-h-[420px] overflow-auto">
              {filteredList.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">
                  No creatures yet. Create your first stat block.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-left text-zinc-400">
                    <tr>
                      <th className="px-3 py-1">Name</th>
                      <th className="px-3 py-1">Type</th>
                      <th className="px-3 py-1">CR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((c) => {
                      const idStr = String(c.id);
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
                              <span>{c.name || "(unnamed)"}</span>
                            </div>
                          </td>
                          <td className="px-3 py-1.5">
                            {nv(c.type ?? "(—)")}
                          </td>
                          <td className="px-3 py-1.5">
                            {nv(c.challenge_rating ?? "(—)")}
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
                    selected.createdBy !== currentUser.id)
                }
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
            <p className="text-sm text-zinc-400">Loading creatures...</p>
          ) : !selected ? (
            <p className="text-sm text-zinc-400">
              Select a creature on the left or create a new one to begin
              editing.
            </p>
          ) : (
            <>
              <div className="mb-4 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1">
                  <Input
                    value={selected.name}
                    onChange={(e) => updateSelected({ name: e.target.value })}
                    placeholder="Creature name (e.g., Dire Wolf, Void Wraith, Clockwork Knight...)"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">
                    This is the label your players and other tools will see
                    everywhere.
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.is_free ?? false}
                        onChange={(e) =>
                          updateSelected({ is_free: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-white/20 bg-black/30 text-violet-500 focus:ring-violet-500/50"
                      />
                      <span className="text-sm text-zinc-300">
                        Free (available to all users)
                      </span>
                    </label>

                    {/* Usage flags: mount / pet / companion */}
                    <div className="flex flex-wrap gap-4 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!selected.can_be_mount}
                          onChange={(e) =>
                            updateSelected({ can_be_mount: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-white/20 bg-black/30 text-emerald-500 focus:ring-emerald-500/50"
                        />
                        <span className="text-xs text-zinc-300">
                          Can be used as a mount
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!selected.can_be_pet}
                          onChange={(e) =>
                            updateSelected({ can_be_pet: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-white/20 bg-black/30 text-sky-500 focus:ring-sky-500/50"
                        />
                        <span className="text-xs text-zinc-300">
                          Can be used as a pet
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!selected.can_be_companion}
                          onChange={(e) =>
                            updateSelected({
                              can_be_companion: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-white/20 bg-black/30 text-amber-500 focus:ring-amber-500/50"
                        />
                        <span className="text-xs text-zinc-300">
                          Can be used as a companion
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  <Tabs
                    tabs={CREATURE_TABS}
                    activeId={activeTab}
                    onChange={(id) => setActiveTab(id as CreatureTabKey)}
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
                {/* IDENTITY */}
                {activeTab === "identity" && (
                  <div className="space-y-4">
                    <FormField label="Alt Names" htmlFor="cre-alt">
                      <Input
                        id="cre-alt"
                        value={selected.alt_names ?? ""}
                        onChange={(e) =>
                          updateSelected({ alt_names: e.target.value })
                        }
                      />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        label="Challenge Rating"
                        htmlFor="cre-cr"
                        description="Difficulty band / threat tier for quick reference."
                      >
                        <Input
                          id="cre-cr"
                          value={selected.challenge_rating ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              challenge_rating: e.target.value,
                            })
                          }
                        />
                      </FormField>
                      <FormField
                        label="Encounter Scale"
                        htmlFor="cre-scale"
                        description="Solo, Elite, Standard, Minion, Swarm, etc."
                      >
                        <Input
                          id="cre-scale"
                          value={selected.encounter_scale ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              encounter_scale: e.target.value,
                            })
                          }
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        label="Type"
                        htmlFor="cre-type"
                        description="Beast, Aberration, Undead, Construct, etc."
                      >
                        <Input
                          id="cre-type"
                          value={selected.type ?? ""}
                          onChange={(e) =>
                            updateSelected({ type: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField
                        label="Role"
                        htmlFor="cre-role"
                        description="Brute, Skirmisher, Artillery, Controller, Support, etc."
                      >
                        <Input
                          id="cre-role"
                          value={selected.role ?? ""}
                          onChange={(e) =>
                            updateSelected({ role: e.target.value })
                          }
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="Size" htmlFor="cre-size">
                        <Input
                          id="cre-size"
                          value={selected.size ?? ""}
                          onChange={(e) =>
                            updateSelected({ size: e.target.value })
                          }
                        />
                      </FormField>
                      <FormField
                        label="Genre Tags"
                        htmlFor="cre-tags"
                        description="Comma- or space-separated tags (fantasy, sci-fi, cosmic horror...)."
                      >
                        <Input
                          id="cre-tags"
                          value={selected.genre_tags ?? ""}
                          onChange={(e) =>
                            updateSelected({ genre_tags: e.target.value })
                          }
                        />
                      </FormField>
                    </div>

                    <FormField
                      label="Short Description"
                      htmlFor="cre-desc"
                      description="1–3 sentences that summarize what this creature is and how it feels at the table."
                    >
                      <textarea
                        id="cre-desc"
                        className="w-full min-h-[140px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selected.description_short ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            description_short: e.target.value,
                          })
                        }
                      />
                    </FormField>
                  </div>
                )}

                {/* STATS */}
                {activeTab === "stats" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormField label="Strength" htmlFor="cre-str">
                        <Input
                          id="cre-str"
                          type="number"
                          value={selected.strength ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              strength:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                        />
                      </FormField>
                      <FormField label="Dexterity" htmlFor="cre-dex">
                        <Input
                          id="cre-dex"
                          type="number"
                          value={selected.dexterity ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              dexterity:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                        />
                      </FormField>
                      <FormField label="Constitution" htmlFor="cre-con">
                        <Input
                          id="cre-con"
                          type="number"
                          value={selected.constitution ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              constitution:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormField label="Intelligence" htmlFor="cre-int">
                        <Input
                          id="cre-int"
                          type="number"
                          value={selected.intelligence ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              intelligence:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                        />
                      </FormField>
                      <FormField label="Wisdom" htmlFor="cre-wis">
                        <Input
                          id="cre-wis"
                          type="number"
                          value={selected.wisdom ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              wisdom:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                        />
                      </FormField>
                      <FormField label="Charisma" htmlFor="cre-cha">
                        <Input
                          id="cre-cha"
                          type="number"
                          value={selected.charisma ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              charisma:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField label="HP Total" htmlFor="cre-hp">
                        <Input
                          id="cre-hp"
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
                      <FormField label="Initiative" htmlFor="cre-init">
                        <Input
                          id="cre-init"
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
                    </div>

                    <FormField
                      label="HP by Location"
                      htmlFor="cre-hp-loc"
                      description="Optional breakdown for called shots or limb targeting."
                    >
                      <textarea
                        id="cre-hp-loc"
                        className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selected.hp_by_location ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            hp_by_location: e.target.value,
                          })
                        }
                      />
                    </FormField>

                    <FormField
                      label="Armor / Soak"
                      htmlFor="cre-armor"
                      description="Flat soak, location-based values, or rules text."
                    >
                      <textarea
                        id="cre-armor"
                        className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selected.armor_soak ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            armor_soak: e.target.value,
                          })
                        }
                      />
                    </FormField>
                  </div>
                )}

                {/* COMBAT */}
                {activeTab === "combat" && (
                  <div className="space-y-4">
                    <FormField
                      label="Attack Modes"
                      htmlFor="cre-attacks"
                      description="Claws, bite, weapons, spells, breath weapons, etc."
                    >
                      <textarea
                        id="cre-attacks"
                        className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selected.attack_modes ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            attack_modes: e.target.value,
                          })
                        }
                      />
                    </FormField>

                    <FormField
                      label="Damage"
                      htmlFor="cre-damage"
                      description="Dice expressions or narrative harm values."
                    >
                      <textarea
                        id="cre-damage"
                        className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selected.damage ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            damage: e.target.value,
                          })
                        }
                      />
                    </FormField>

                    <FormField
                      label="Range"
                      htmlFor="cre-range"
                      description="Threat ranges, reach, projectile distances, zones, etc."
                    >
                      <Input
                        id="cre-range"
                        value={selected.range_text ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            range_text: e.target.value,
                          })
                        }
                      />
                    </FormField>

                    <FormField
                      label="Special Abilities"
                      htmlFor="cre-special"
                      description="Unique moves, actions, reactions, or passives."
                    >
                      <textarea
                        id="cre-special"
                        className="w-full min-h-[140px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selected.special_abilities ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            special_abilities: e.target.value,
                          })
                        }
                      />
                    </FormField>

                    <FormField
                      label="Magic / Resonance Interaction"
                      htmlFor="cre-res"
                      description="How this creature reacts to Source, magic, psionics, tech, etc."
                    >
                      <textarea
                        id="cre-res"
                        className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selected.magic_resonance_interaction ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            magic_resonance_interaction: e.target.value,
                          })
                        }
                      />
                    </FormField>
                  </div>
                )}

                {/* BEHAVIOR & LORE */}
                {activeTab === "behavior" && (
                  <div className="space-y-4">
                    <FormField
                      label="Behavior & Tactics"
                      htmlFor="cre-behavior"
                      description="How it fights, flees, chooses targets, and responds under pressure."
                    >
                      <textarea
                        id="cre-behavior"
                        className="w-full min-h-[140px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selected.behavior_tactics ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            behavior_tactics: e.target.value,
                          })
                        }
                      />
                    </FormField>

                    <FormField label="Habitat" htmlFor="cre-habitat">
                      <textarea
                        id="cre-habitat"
                        className="w-full min-h-[80px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selected.habitat ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            habitat: e.target.value,
                          })
                        }
                      />
                    </FormField>

                    <FormField label="Diet" htmlFor="cre-diet">
                      <textarea
                        id="cre-diet"
                        className="w-full min-h-[80px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selected.diet ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            diet: e.target.value,
                          })
                        }
                      />
                    </FormField>

                    <FormField label="Variants" htmlFor="cre-variants">
                      <textarea
                        id="cre-variants"
                        className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selected.variants ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            variants: e.target.value,
                          })
                        }
                      />
                    </FormField>

                    <FormField
                      label="Loot / Harvest"
                      htmlFor="cre-loot"
                      description="What can be recovered from this creature (materials, organs, trophies, etc.)."
                    >
                      <textarea
                        id="cre-loot"
                        className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selected.loot_harvest ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            loot_harvest: e.target.value,
                          })
                        }
                      />
                    </FormField>

                    <FormField
                      label="Story Hooks"
                      htmlFor="cre-hooks"
                      description="Rumors, quests, or arcs that naturally arise from this creature."
                    >
                      <textarea
                        id="cre-hooks"
                        className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selected.story_hooks ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            story_hooks: e.target.value,
                          })
                        }
                      />
                    </FormField>

                    <FormField label="Notes" htmlFor="cre-notes">
                      <textarea
                        id="cre-notes"
                        className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={selected.notes ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            notes: e.target.value,
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
                      label="Creature Preview"
                      htmlFor="cre-preview"
                      description="Text block you can paste into modules, sheets, or VTT notes."
                    >
                      <textarea
                        id="cre-preview"
                        readOnly
                        value={previewText}
                        className="w-full h-[400px] rounded-lg border border-white/10 bg-neutral-950/70 px-3 py-2 text-xs text-zinc-200 font-mono"
                      />
                    </FormField>

                    <div className="mt-2 text-[11px] text-zinc-500">
                      Creature identity, stats, combat, and lore all roll into
                      this export block, including whether it can be used as a
                      mount, pet, or companion.
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
