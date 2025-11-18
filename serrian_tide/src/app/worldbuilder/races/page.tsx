"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { GradientText } from "@/components/GradientText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { Input } from "@/components/Input";
import { Tabs } from "@/components/Tabs";

/* ---------- Worldbuilder local nav ---------- */

function WBNav({
  current = "races",
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

/* ---------- Types (mirroring your old logic) ---------- */

type TabKey = "identity" | "attributes" | "bonuses" | "preview";

type RaceDefinition = {
  legacy_description?: string | null;
  physical_characteristics?: string | null;
  physical_description?: string | null;
  racial_quirk?: string | null;
  quirk_success_effect?: string | null;
  quirk_failure_effect?: string | null;
  common_languages_known?: string | null;
  common_archetypes?: string | null;
  examples_by_genre?: string | null;
  cultural_mindset?: string | null;
  outlook_on_magic?: string | null;
};

type RaceAttributes = {
  age_range?: string | null;
  size?: string | null;
  strength_max?: string | null;
  dexterity_max?: string | null;
  constitution_max?: string | null;
  intelligence_max?: string | null;
  wisdom_max?: string | null;
  charisma_max?: string | null;
  base_magic?: string | null;
  base_movement?: string | null;
};

type BonusRow = {
  slotIdx: number;
  skillName: string;
  points: string;
};

type RaceRecord = {
  id: string | number;
  name: string;
  tagline: string;
  is_free?: boolean;
  createdBy?: string;
  def: RaceDefinition;
  attr: RaceAttributes;
  bonusRows: BonusRow[];
  specialRows: BonusRow[];
};

/* ---------- Constants ---------- */

const TAB_SECTIONS: { id: TabKey; label: string }[] = [
  { id: "identity", label: "Identity & Lore" },
  { id: "attributes", label: "Attributes" },
  { id: "bonuses", label: "Bonuses" },
  { id: "preview", label: "Preview" },
];

const SIZE_OPTIONS = [
  "tiny",
  "small",
  "average",
  "large",
  "gigantic",
  "titan",
] as const;

const MAX_BONUS_SKILLS = 7;
const MAX_SPECIALS = 5;

function makeBonusRows(count: number): BonusRow[] {
  return Array.from({ length: count }, (_, i) => ({
    slotIdx: i,
    skillName: "",
    points: "0",
  }));
}

const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------- Page ---------- */

export default function RacesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("identity");

  // User session
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);

  // Library of races
  const [races, setRaces] = useState<RaceRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qtext, setQtext] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Skills for dropdowns
  const [tier1Skills, setTier1Skills] = useState<Array<{ id: string; name: string }>>([]);
  const [specialAbilitySkills, setSpecialAbilitySkills] = useState<Array<{ id: string; name: string }>>([]);

  // Load races and skills from database on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Load current user
        const userResponse = await fetch("/api/profile/me");
        const userData = await userResponse.json();
        if (userData.ok && userData.user) {
          setCurrentUser({ id: userData.user.id, role: userData.user.role });
        }

        // Load races
        const racesResponse = await fetch("/api/worldbuilder/races");
        const racesData = await racesResponse.json();
        
        // Load skills
        const skillsResponse = await fetch("/api/worldbuilder/skills");
        const skillsData = await skillsResponse.json();
        
        if (!racesData.ok) {
          throw new Error(racesData.error || "Failed to load races");
        }
        
        if (!skillsData.ok) {
          throw new Error(skillsData.error || "Failed to load skills");
        }

        // Process skills
        const allSkills = skillsData.skills || [];
        const tier1 = allSkills
          .filter((s: any) => s.tier === 1)
          .map((s: any) => ({ id: s.id, name: s.name }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        
        const specials = allSkills
          .filter((s: any) => s.type === "special ability")
          .map((s: any) => ({ id: s.id, name: s.name }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        
        setTier1Skills(tier1);
        setSpecialAbilitySkills(specials);

        // Transform API response to match our UI format
        const transformed: RaceRecord[] = (racesData.races || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          tagline: r.tagline || "",
          is_free: r.isFree ?? true,
          createdBy: r.createdBy,
          def: r.definition || {},
          attr: r.attributes || {},
          bonusRows: [
            ...(r.bonusSkills || []).map((b: any, idx: number) => ({
              slotIdx: idx,
              skillName: b.skillName || "",
              points: String(b.points || 0),
            })),
            ...makeBonusRows(MAX_BONUS_SKILLS - (r.bonusSkills || []).length),
          ].map((row, idx) => ({ ...row, slotIdx: idx })),
          specialRows: [
            ...(r.specialAbilities || []).map((s: any, idx: number) => ({
              slotIdx: idx,
              skillName: s.skillName || "",
              points: String(s.points || 0),
            })),
            ...makeBonusRows(MAX_SPECIALS - (r.specialAbilities || []).length),
          ].map((row, idx) => ({ ...row, slotIdx: idx })),
        }));

        setRaces(transformed);
      } catch (error) {
        console.error("Error loading data:", error);
        alert(`Failed to load data: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const selected: RaceRecord | null = useMemo(
    () =>
      races.find((r) => String(r.id) === String(selectedId ?? "")) ?? null,
    [races, selectedId]
  );

  // ensure something is selected when the list changes
  useEffect(() => {
    if (!races.length) {
      setSelectedId(null);
      return;
    }
    if (!selected) {
      const first = races[0];
      if (first) setSelectedId(String(first.id));
    }
  }, [races, selected]);

  const filteredList = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    if (!q) return races;
    return races.filter((r) => {
      const base = [
        r.name,
        r.tagline,
        r.def.examples_by_genre ?? "",
        r.def.cultural_mindset ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return base.includes(q);
    });
  }, [races, qtext]);

  /* ---------- library CRUD helpers (UI-only) ---------- */

  function createRace() {
    const id = uid();
    const newRace: RaceRecord = {
      id,
      name: "New Race",
      tagline: "",
      is_free: true,
      def: {},
      attr: {},
      bonusRows: makeBonusRows(MAX_BONUS_SKILLS),
      specialRows: makeBonusRows(MAX_SPECIALS),
    };
    setRaces((prev) => [newRace, ...prev]);
    setSelectedId(id);
  }

  async function deleteSelected() {
    if (!selected || !currentUser) return;
    
    const isAdmin = currentUser.role?.toLowerCase() === "admin";
    const isCreator = selected.createdBy === currentUser.id;
    
    if (!isAdmin && !isCreator) {
      alert("You can only delete races you created. Admins can delete any race.");
      return;
    }
    
    if (!confirm("Delete this race from the library?")) return;
    
    const idStr = String(selected.id);
    const isNew = typeof selected.id === "string" && selected.id.length < 20;

    // If it's a UI-only race (not yet saved), just remove from state
    if (isNew) {
      setRaces((prev) => prev.filter((r) => String(r.id) !== idStr));
      setSelectedId(null);
      return;
    }

    try {
      const response = await fetch(`/api/worldbuilder/races/${selected.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to delete race");
      }

      setRaces((prev) => prev.filter((r) => String(r.id) !== idStr));
      setSelectedId(null);
      alert("Race deleted successfully!");
    } catch (error) {
      console.error("Error deleting race:", error);
      alert(`Failed to delete race: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  function updateSelected(patch: Partial<RaceRecord>) {
    if (!selected) return;
    const idStr = String(selected.id);
    setRaces((prev) =>
      prev.map((r) =>
        String(r.id) === idStr ? ({ ...r, ...patch } as RaceRecord) : r
      )
    );
  }

  function updateDef<K extends keyof RaceDefinition>(key: K, value: string) {
    if (!selected) return;
    const idStr = String(selected.id);
    setRaces((prev) =>
      prev.map((r) =>
        String(r.id) === idStr
          ? ({
              ...r,
              def: { ...(r.def || {}), [key]: value },
            } as RaceRecord)
          : r
      )
    );
  }

  function updateAttr<K extends keyof RaceAttributes>(
    key: K,
    value: string
  ) {
    if (!selected) return;
    const idStr = String(selected.id);
    setRaces((prev) =>
      prev.map((r) =>
        String(r.id) === idStr
          ? ({
              ...r,
              attr: { ...(r.attr || {}), [key]: value },
            } as RaceRecord)
          : r
      )
    );
  }

  function updateBonusRow(
    idx: number,
    field: "skillName" | "points",
    value: string
  ) {
    if (!selected) return;
    const idStr = String(selected.id);
    setRaces((prev) =>
      prev.map((r) => {
        if (String(r.id) !== idStr) return r;
        const updatedRows = r.bonusRows.map((row) =>
          row.slotIdx === idx ? { ...row, [field]: value } : row
        );
        return { ...r, bonusRows: updatedRows } as RaceRecord;
      })
    );
  }

  function updateSpecialRow(
    idx: number,
    field: "skillName" | "points",
    value: string
  ) {
    if (!selected) return;
    const idStr = String(selected.id);
    setRaces((prev) =>
      prev.map((r) => {
        if (String(r.id) !== idStr) return r;
        const updatedRows = r.specialRows.map((row) =>
          row.slotIdx === idx ? { ...row, [field]: value } : row
        );
        return { ...r, specialRows: updatedRows } as RaceRecord;
      })
    );
  }

  async function saveSelected() {
    if (!selected) return;
    
    try {
      // Transform bonusRows and specialRows into the JSONB format expected by the API
      const bonusSkills = selected.bonusRows
        .filter((r) => r.skillName.trim() !== "")
        .map((r) => ({ skillName: r.skillName, points: parseInt(r.points) || 0 }));
      
      const specialAbilities = selected.specialRows
        .filter((r) => r.skillName.trim() !== "")
        .map((r) => ({ skillName: r.skillName, points: parseInt(r.points) || 0 }));

      const payload = {
        name: selected.name,
        tagline: selected.tagline || null,
        isFree: selected.is_free ?? true,
        definition: selected.def,
        attributes: selected.attr,
        bonusSkills,
        specialAbilities,
      };

      // Check if this is a new race (string ID means UI-only) or existing (UUID means from DB)
      const isNew = typeof selected.id === "string" && selected.id.length < 20;

      let response;
      if (isNew) {
        // Create new race
        response = await fetch("/api/worldbuilder/races", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Update existing race
        response = await fetch(`/api/worldbuilder/races/${selected.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to save race");
      }

      // Update the local state with the saved race (including the new ID if it was created)
      if (isNew && data.race) {
        const oldId = selected.id;
        setRaces((prev) =>
          prev.map((r) =>
            String(r.id) === String(oldId)
              ? { ...r, id: data.race.id }
              : r
          )
        );
        setSelectedId(data.race.id);
      }

      alert("Race saved successfully!");
    } catch (error) {
      console.error("Error saving race:", error);
      alert(`Failed to save race: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /* ---------- preview text ---------- */

  const previewText = useMemo(() => {
    if (!selected) return "";

    const { name, tagline, def, attr, bonusRows, specialRows } = selected;

    const nv = (x: any) =>
      x == null || x === "" ? "—" : String(x).trim() === "" ? "—" : x;

    const lines: string[] = [];

    lines.push(`Race: ${name || "New Race"}`);
    if (tagline) {
      lines.push(`"${tagline}"`);
    }
    lines.push("");

    // Identity / lore
    lines.push("— Identity & Lore —");
    const defEntries: [string, string | null | undefined][] = [
      ["Legacy Description", def.legacy_description],
      ["Physical Characteristics", def.physical_characteristics],
      ["Physical Description", def.physical_description],
      ["Racial Quirk", def.racial_quirk],
      ["Quirk Success Effect", def.quirk_success_effect],
      ["Quirk Failure Effect", def.quirk_failure_effect],
      ["Common Languages Known", def.common_languages_known],
      ["Common Archetypes", def.common_archetypes],
      ["Examples by Genre", def.examples_by_genre],
      ["Cultural Mindset", def.cultural_mindset],
      ["Outlook on Magic", def.outlook_on_magic],
    ];

    defEntries.forEach(([label, v]) => {
      if (!v || String(v).trim() === "") return;
      const value = String(v);
      const clipped =
        value.length > 200 ? `${value.slice(0, 200)}…` : value;
      lines.push(`${label}: ${clipped}`);
    });

    lines.push("");
    lines.push("— Attributes —");
    lines.push(
      `Age / Size: ${nv(attr.age_range)} / ${nv(attr.size)}`
    );
    lines.push(
      `STR / DEX / CON: ${nv(attr.strength_max)} / ${nv(
        attr.dexterity_max
      )} / ${nv(attr.constitution_max)}`
    );
    lines.push(
      `INT / WIS / CHA: ${nv(attr.intelligence_max)} / ${nv(
        attr.wisdom_max
      )} / ${nv(attr.charisma_max)}`
    );
    lines.push(
      `Base Magic / Movement: ${nv(attr.base_magic)} / ${nv(
        attr.base_movement
      )}`
    );

    lines.push("");
    lines.push("— Bonus Skills —");
    const bonusActive = bonusRows.filter(
      (b) => b.skillName.trim() !== ""
    );
    if (bonusActive.length === 0) {
      lines.push(" • (none)");
    } else {
      bonusActive.forEach((b) => {
        lines.push(` • ${b.skillName} (+${b.points || "0"})`);
      });
    }

    lines.push("");
    lines.push("— Racial Special Abilities —");
    const specialActive = specialRows.filter(
      (s) => s.skillName.trim() !== ""
    );
    if (specialActive.length === 0) {
      lines.push(" • (none)");
    } else {
      specialActive.forEach((s) => {
        lines.push(` • ${s.skillName} (+${s.points || "0"})`);
      });
    }

    return lines.join("\n");
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
              The Source Forge — Races
            </GradientText>
            <p className="mt-1 text-sm text-zinc-300/90 max-w-2xl">
              Define racial lore, attribute caps, and racial bonuses. This
              screen is UI-only; DB wiring and auto-save will plug in after
              we lock the structure.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Link href="/worldbuilder">
              <Button variant="secondary" size="sm">
                ← Source Forge
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex justify-end">
          <WBNav current="races" />
        </div>
      </header>

      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
        {/* Left column: Race Library */}
        <Card
          padded={false}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-200">
              Race Library
            </h2>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={createRace}
            >
              + New Race
            </Button>
          </div>

          {/* Filter */}
          <div className="space-y-2">
            <Input
              value={qtext}
              onChange={(e) => setQtext(e.target.value)}
              placeholder="Search races by name, tagline, or lore…"
            />
          </div>

          {/* List */}
          <div className="mt-2 flex-1 min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 border-b border-white/10">
              <span>Races: {filteredList.length}</span>
              <span className="uppercase tracking-wide text-[10px] text-zinc-500">
                Race records
              </span>
            </div>

            <div className="max-h-[420px] overflow-auto">
              {filteredList.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">
                  No races yet. Create your first lineage.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-left text-zinc-400">
                    <tr>
                      <th className="px-3 py-1">Name</th>
                      <th className="px-3 py-1">Tagline</th>
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
                          <td className="px-3 py-1.5">
                            {r.tagline ? r.tagline : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Quick rename + delete */}
            <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 border-t border-white/10">
              <div className="flex flex-col gap-1 flex-1 pr-2">
                <span>Race Name</span>
                <input
                  className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-xs text-zinc-100 outline-none"
                  disabled={!selected}
                  value={selected?.name ?? ""}
                  onChange={(e) =>
                    updateSelected({ name: e.target.value })
                  }
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={!selected || !currentUser || (currentUser.role?.toLowerCase() !== "admin" && selected.createdBy !== currentUser.id)}
                onClick={deleteSelected}
              >
                Delete
              </Button>
            </div>

            <div className="px-3 pb-3 pt-1 text-xs text-zinc-400 border-t border-white/10">
              <div className="flex flex-col gap-1">
                <span>Tagline</span>
                <input
                  className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-xs text-zinc-100 outline-none"
                  disabled={!selected}
                  value={selected?.tagline ?? ""}
                  onChange={(e) =>
                    updateSelected({ tagline: e.target.value })
                  }
                  placeholder="Stoic guardians of forgotten seas..."
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Right column: main editor */}
        <Card
          padded={false}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl"
        >
          {loading ? (
            <p className="text-sm text-zinc-400">
              Loading races...
            </p>
          ) : !selected ? (
            <p className="text-sm text-zinc-400">
              Select a race on the left or create a new one to begin
              editing.
            </p>
          ) : (
            <>
              {/* Header: name + tabs + save */}
              <div className="mb-4 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1">
                  <Input
                    value={selected.name}
                    onChange={(e) =>
                      updateSelected({ name: e.target.value })
                    }
                    placeholder="Race name (e.g., Serrian, Tideborn, Ashwalker...)"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">
                    This is the label that will appear in character
                    creation, sheets, and world docs.
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
                    tabs={TAB_SECTIONS}
                    activeId={activeTab}
                    onChange={(id) => setActiveTab(id as TabKey)}
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
                {/* Identity & Lore */}
                {activeTab === "identity" && (
                  <div className="space-y-4">
                    <FormField
                      label="Legacy Description"
                      htmlFor="legacy-description"
                      description="If this race already exists somewhere else, capture that legacy version here."
                    >
                      <textarea
                        id="legacy-description"
                        value={selected.def.legacy_description ?? ""}
                        onChange={(e) =>
                          updateDef(
                            "legacy_description",
                            e.target.value
                          )
                        }
                        className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      />
                    </FormField>

                    <FormField
                      label="Physical Characteristics"
                      htmlFor="physical-characteristics"
                      description="Common builds, features, and standout physical traits."
                    >
                      <textarea
                        id="physical-characteristics"
                        value={
                          selected.def.physical_characteristics ?? ""
                        }
                        onChange={(e) =>
                          updateDef(
                            "physical_characteristics",
                            e.target.value
                          )
                        }
                        className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      />
                    </FormField>

                    <FormField
                      label="Physical Description"
                      htmlFor="physical-description"
                      description="How would you describe this race at the table to new players?"
                    >
                      <textarea
                        id="physical-description"
                        value={
                          selected.def.physical_description ?? ""
                        }
                        onChange={(e) =>
                          updateDef(
                            "physical_description",
                            e.target.value
                          )
                        }
                        className="w-full min-h-[140px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      />
                    </FormField>

                    <FormField
                      label="Racial Quirk"
                      htmlFor="racial-quirk"
                      description="A signature quirk that can trigger special outcomes."
                    >
                      <Input
                        id="racial-quirk"
                        value={selected.def.racial_quirk ?? ""}
                        onChange={(e) =>
                          updateDef("racial_quirk", e.target.value)
                        }
                        placeholder="e.g., Tidal Memory, Ember Sight, Void Drift..."
                      />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Quirk Success Effect"
                        htmlFor="quirk-success"
                      >
                        <textarea
                          id="quirk-success"
                          value={
                            selected.def.quirk_success_effect ?? ""
                          }
                          onChange={(e) =>
                            updateDef(
                              "quirk_success_effect",
                              e.target.value
                            )
                          }
                          className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        />
                      </FormField>

                      <FormField
                        label="Quirk Failure Effect"
                        htmlFor="quirk-failure"
                      >
                        <textarea
                          id="quirk-failure"
                          value={
                            selected.def.quirk_failure_effect ?? ""
                          }
                          onChange={(e) =>
                            updateDef(
                              "quirk_failure_effect",
                              e.target.value
                            )
                          }
                          className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        />
                      </FormField>
                    </div>

                    <FormField
                      label="Common Languages Known"
                      htmlFor="languages"
                      description="Typical languages this race is expected to know."
                    >
                      <textarea
                        id="languages"
                        value={
                          selected.def.common_languages_known ?? ""
                        }
                        onChange={(e) =>
                          updateDef(
                            "common_languages_known",
                            e.target.value
                          )
                        }
                        className="w-full min-h-[80px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      />
                    </FormField>

                    <FormField
                      label="Common Archetypes"
                      htmlFor="archetypes"
                      description="Typical roles this race falls into (classes, archetypes, professions)."
                    >
                      <textarea
                        id="archetypes"
                        value={
                          selected.def.common_archetypes ?? ""
                        }
                        onChange={(e) =>
                          updateDef(
                            "common_archetypes",
                            e.target.value
                          )
                        }
                        className="w-full min-h-[80px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      />
                    </FormField>

                    <FormField
                      label="Examples by Genre"
                      htmlFor="examples-by-genre"
                      description="How does this race show up in fantasy, sci-fi, horror, etc.?"
                    >
                      <textarea
                        id="examples-by-genre"
                        value={
                          selected.def.examples_by_genre ?? ""
                        }
                        onChange={(e) =>
                          updateDef(
                            "examples_by_genre",
                            e.target.value
                          )
                        }
                        className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      />
                    </FormField>

                    <FormField
                      label="Cultural Mindset"
                      htmlFor="cultural-mindset"
                      description="What is their default outlook on life, conflict, community?"
                    >
                      <textarea
                        id="cultural-mindset"
                        value={selected.def.cultural_mindset ?? ""}
                        onChange={(e) =>
                          updateDef(
                            "cultural_mindset",
                            e.target.value
                          )
                        }
                        className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      />
                    </FormField>

                    <FormField
                      label="Outlook on Magic"
                      htmlFor="outlook-on-magic"
                      description="How does this race view magic, psionics, tech, or other power sources?"
                    >
                      <textarea
                        id="outlook-on-magic"
                        value={selected.def.outlook_on_magic ?? ""}
                        onChange={(e) =>
                          updateDef(
                            "outlook_on_magic",
                            e.target.value
                          )
                        }
                        className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      />
                    </FormField>
                  </div>
                )}

                {/* Attributes */}
                {activeTab === "attributes" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Age Range"
                        htmlFor="age-range"
                        description="Typical lifespan or playable age range."
                      >
                        <Input
                          id="age-range"
                          value={selected.attr.age_range ?? ""}
                          onChange={(e) =>
                            updateAttr("age_range", e.target.value)
                          }
                          placeholder="e.g., 15–90"
                        />
                      </FormField>

                      <FormField
                        label="Size"
                        htmlFor="size"
                        description="Choose the baseline size category."
                      >
                        <select
                          id="size"
                          value={selected.attr.size ?? ""}
                          onChange={(e) =>
                            updateAttr("size", e.target.value)
                          }
                          className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-amber-400/40"
                        >
                          <option value="">(choose)</option>
                          {SIZE_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField label="STR Max" htmlFor="str-max">
                        <Input
                          id="str-max"
                          type="number"
                          value={selected.attr.strength_max ?? ""}
                          onChange={(e) =>
                            updateAttr(
                              "strength_max",
                              e.target.value
                            )
                          }
                        />
                      </FormField>
                      <FormField label="DEX Max" htmlFor="dex-max">
                        <Input
                          id="dex-max"
                          type="number"
                          value={selected.attr.dexterity_max ?? ""}
                          onChange={(e) =>
                            updateAttr(
                              "dexterity_max",
                              e.target.value
                            )
                          }
                        />
                      </FormField>
                      <FormField label="CON Max" htmlFor="con-max">
                        <Input
                          id="con-max"
                          type="number"
                          value={selected.attr.constitution_max ?? ""}
                          onChange={(e) =>
                            updateAttr(
                              "constitution_max",
                              e.target.value
                            )
                          }
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField label="INT Max" htmlFor="int-max">
                        <Input
                          id="int-max"
                          type="number"
                          value={
                            selected.attr.intelligence_max ?? ""
                          }
                          onChange={(e) =>
                            updateAttr(
                              "intelligence_max",
                              e.target.value
                            )
                          }
                        />
                      </FormField>
                      <FormField label="WIS Max" htmlFor="wis-max">
                        <Input
                          id="wis-max"
                          type="number"
                          value={selected.attr.wisdom_max ?? ""}
                          onChange={(e) =>
                            updateAttr(
                              "wisdom_max",
                              e.target.value
                            )
                          }
                        />
                      </FormField>
                      <FormField label="CHA Max" htmlFor="cha-max">
                        <Input
                          id="cha-max"
                          type="number"
                          value={selected.attr.charisma_max ?? ""}
                          onChange={(e) =>
                            updateAttr(
                              "charisma_max",
                              e.target.value
                            )
                          }
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Base Magic" htmlFor="base-magic">
                        <Input
                          id="base-magic"
                          type="number"
                          value={selected.attr.base_magic ?? ""}
                          onChange={(e) =>
                            updateAttr(
                              "base_magic",
                              e.target.value
                            )
                          }
                        />
                      </FormField>
                      <FormField
                        label="Base Movement"
                        htmlFor="base-movement"
                      >
                        <Input
                          id="base-movement"
                          type="number"
                          value={selected.attr.base_movement ?? ""}
                          onChange={(e) =>
                            updateAttr(
                              "base_movement",
                              e.target.value
                            )
                          }
                        />
                      </FormField>
                    </div>
                  </div>
                )}

                {/* Bonuses */}
                {activeTab === "bonuses" && (
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-lg font-semibold mb-3 text-zinc-200">
                        Bonus Skills (Tier 1 only)
                      </h3>
                      <p className="text-xs text-zinc-400 mb-3">
                        Select from Tier 1 skills in your skills library.
                      </p>
                      <div className="rounded-lg border border-white/15 bg-white/5 p-4">
                        <div className="grid gap-2">
                          {selected.bonusRows.map((row) => (
                            <div
                              key={row.slotIdx}
                              className="flex items-center gap-3"
                            >
                              <select
                                value={row.skillName}
                                onChange={(e) =>
                                  updateBonusRow(
                                    row.slotIdx,
                                    "skillName",
                                    e.target.value
                                  )
                                }
                                className="min-w-[300px] flex-1 rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-amber-400/40"
                              >
                                <option value="">(none)</option>
                                {tier1Skills.map((skill) => (
                                  <option key={skill.id} value={skill.name}>
                                    {skill.name}
                                  </option>
                                ))}
                              </select>
                              <span className="text-sm text-zinc-400 shrink-0">
                                pts
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={999}
                                value={row.points}
                                onChange={(e) =>
                                  updateBonusRow(
                                    row.slotIdx,
                                    "points",
                                    e.target.value
                                  )
                                }
                                className="w-16 shrink-0 rounded-lg border border-white/10 bg-neutral-950/50 px-2 py-2 text-sm text-zinc-100 text-center outline-none focus:ring-2 focus:ring-amber-400/40"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold mb-3 text-zinc-200">
                        Racial Special Abilities
                      </h3>
                      <p className="text-xs text-zinc-400 mb-3">
                        Select from special ability type skills in your skills library.
                      </p>
                      <div className="rounded-lg border border-white/15 bg-white/5 p-4">
                        <div className="grid gap-2">
                          {selected.specialRows.map((row) => (
                            <div
                              key={row.slotIdx}
                              className="flex items-center gap-3"
                            >
                              <select
                                value={row.skillName}
                                onChange={(e) =>
                                  updateSpecialRow(
                                    row.slotIdx,
                                    "skillName",
                                    e.target.value
                                  )
                                }
                                className="min-w-[300px] flex-1 rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-amber-400/40"
                              >
                                <option value="">(none)</option>
                                {specialAbilitySkills.map((skill) => (
                                  <option key={skill.id} value={skill.name}>
                                    {skill.name}
                                  </option>
                                ))}
                              </select>
                              <span className="text-sm text-zinc-400 shrink-0">
                                pts
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={999}
                                value={row.points}
                                onChange={(e) =>
                                  updateSpecialRow(
                                    row.slotIdx,
                                    "points",
                                    e.target.value
                                  )
                                }
                                className="w-16 shrink-0 rounded-lg border border-white/10 bg-neutral-950/50 px-2 py-2 text-sm text-zinc-100 text-center outline-none focus:ring-2 focus:ring-amber-400/40"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* Preview */}
                {activeTab === "preview" && (
                  <div>
                    <FormField
                      label="Preview"
                      htmlFor="race-preview"
                      description="Rough writeup for this race, combining all other tabs."
                    >
                      <textarea
                        id="race-preview"
                        readOnly
                        value={previewText}
                        className="w-full h-[500px] rounded-lg border border-white/10 bg-neutral-950/70 px-3 py-2 text-xs text-zinc-200 font-mono"
                      />
                    </FormField>
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
