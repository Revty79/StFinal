"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GradientText } from "@/components/GradientText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { Input } from "@/components/Input";
import { Tabs } from "@/components/Tabs";

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

/* ---------- Page ---------- */

export default function RacesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("identity");

  // Simple draft state (no DB yet)
  const [raceName, setRaceName] = useState("");
  const [raceTagline, setRaceTagline] = useState("");

  const [def, setDef] = useState<RaceDefinition>({});
  const [attr, setAttr] = useState<RaceAttributes>({});
  const [bonusRows, setBonusRows] = useState<BonusRow[]>(
    makeBonusRows(MAX_BONUS_SKILLS)
  );
  const [specialRows, setSpecialRows] = useState<BonusRow[]>(
    makeBonusRows(MAX_SPECIALS)
  );

  const previewText = useMemo(() => {
    const nv = (x: any) =>
      x == null || x === "" ? "—" : String(x).trim() === "" ? "—" : x;

    const lines: string[] = [];

    lines.push(`Race: ${raceName || "New Race"}`);
    if (raceTagline) {
      lines.push(`"${raceTagline}"`);
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
  }, [raceName, raceTagline, def, attr, bonusRows, specialRows]);

  /* ---------- helpers ---------- */

  function updateDef<K extends keyof RaceDefinition>(key: K, value: string) {
    setDef((prev) => ({ ...prev, [key]: value }));
  }

  function updateAttr<K extends keyof RaceAttributes>(key: K, value: string) {
    setAttr((prev) => ({ ...prev, [key]: value }));
  }

  function updateBonusRow(
    idx: number,
    field: "skillName" | "points",
    value: string
  ) {
    setBonusRows((rows) =>
      rows.map((r) =>
        r.slotIdx === idx ? { ...r, [field]: value } : r
      )
    );
  }

  function updateSpecialRow(
    idx: number,
    field: "skillName" | "points",
    value: string
  ) {
    setSpecialRows((rows) =>
      rows.map((r) =>
        r.slotIdx === idx ? { ...r, [field]: value } : r
      )
    );
  }

  /* ---------- render ---------- */

  return (
    <main className="min-h-screen px-6 py-10">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <GradientText
            as="h1"
            variant="title"
            glow
            className="font-evanescent text-4xl sm:text-5xl tracking-tight"
          >
            The Source Forge — Races
          </GradientText>
          <p className="mt-1 text-sm text-zinc-300/90">
            Define racial lore, attribute caps, and racial bonuses. DB wiring
            and auto-save will plug in after we lock the structure.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/worldbuilder">
            <Button variant="secondary" size="sm">
              ← Source Forge
            </Button>
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6">
        {/* Left column: placeholder selector / metadata */}
        <Card
          padded={false}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl"
        >
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">
            Race Selector (Coming Soon)
          </h2>
          <p className="text-xs text-zinc-400">
            This panel will list your saved races and let you switch, duplicate,
            and delete. For now, you&apos;re editing a single local draft.
          </p>

          <div className="mt-4 space-y-3">
            <FormField
              label="Race Name"
              htmlFor="race-name"
              description="What is this lineage called?"
            >
              <Input
                id="race-name"
                value={raceName}
                onChange={(e) => setRaceName(e.target.value)}
                placeholder="e.g., Serrian, Tideborn, Ashwalker..."
              />
            </FormField>

            <FormField
              label="Tagline"
              htmlFor="race-tagline"
              description="A short hook for this race."
            >
              <Input
                id="race-tagline"
                value={raceTagline}
                onChange={(e) => setRaceTagline(e.target.value)}
                placeholder="Stoic guardians of forgotten seas..."
              />
            </FormField>

            <div className="flex flex-col gap-2 pt-2">
              <Button variant="primary" size="sm" disabled>
                Save Draft (DB Coming Soon)
              </Button>
              <Button variant="secondary" size="sm" disabled>
                New Race
              </Button>
            </div>
          </div>
        </Card>

        {/* Right column: main editor */}
        <Card
          padded={false}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl"
        >
          <div className="mb-4">
            <Tabs
              tabs={TAB_SECTIONS}
              activeId={activeTab}
              onChange={(id) => setActiveTab(id as TabKey)}
            />
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
                    value={def.legacy_description ?? ""}
                    onChange={(e) =>
                      updateDef("legacy_description", e.target.value)
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
                    value={def.physical_characteristics ?? ""}
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
                    value={def.physical_description ?? ""}
                    onChange={(e) =>
                      updateDef("physical_description", e.target.value)
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
                    value={def.racial_quirk ?? ""}
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
                      value={def.quirk_success_effect ?? ""}
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
                      value={def.quirk_failure_effect ?? ""}
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
                    value={def.common_languages_known ?? ""}
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
                    value={def.common_archetypes ?? ""}
                    onChange={(e) =>
                      updateDef("common_archetypes", e.target.value)
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
                    value={def.examples_by_genre ?? ""}
                    onChange={(e) =>
                      updateDef("examples_by_genre", e.target.value)
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
                    value={def.cultural_mindset ?? ""}
                    onChange={(e) =>
                      updateDef("cultural_mindset", e.target.value)
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
                    value={def.outlook_on_magic ?? ""}
                    onChange={(e) =>
                      updateDef("outlook_on_magic", e.target.value)
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
                      value={attr.age_range ?? ""}
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
                      value={attr.size ?? ""}
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
                      value={attr.strength_max ?? ""}
                      onChange={(e) =>
                        updateAttr("strength_max", e.target.value)
                      }
                    />
                  </FormField>
                  <FormField label="DEX Max" htmlFor="dex-max">
                    <Input
                      id="dex-max"
                      type="number"
                      value={attr.dexterity_max ?? ""}
                      onChange={(e) =>
                        updateAttr("dexterity_max", e.target.value)
                      }
                    />
                  </FormField>
                  <FormField label="CON Max" htmlFor="con-max">
                    <Input
                      id="con-max"
                      type="number"
                      value={attr.constitution_max ?? ""}
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
                      value={attr.intelligence_max ?? ""}
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
                      value={attr.wisdom_max ?? ""}
                      onChange={(e) =>
                        updateAttr("wisdom_max", e.target.value)
                      }
                    />
                  </FormField>
                  <FormField label="CHA Max" htmlFor="cha-max">
                    <Input
                      id="cha-max"
                      type="number"
                      value={attr.charisma_max ?? ""}
                      onChange={(e) =>
                        updateAttr("charisma_max", e.target.value)
                      }
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Base Magic" htmlFor="base-magic">
                    <Input
                      id="base-magic"
                      type="number"
                      value={attr.base_magic ?? ""}
                      onChange={(e) =>
                        updateAttr("base_magic", e.target.value)
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
                      value={attr.base_movement ?? ""}
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
                  <div className="rounded-lg border border-white/15 bg-white/5 p-4">
                    <div className="grid gap-2">
                      {bonusRows.map((row) => (
                        <div
                          key={row.slotIdx}
                          className="flex items-center gap-3"
                        >
                          <Input
                            placeholder="Skill name"
                            value={row.skillName}
                            onChange={(e) =>
                              updateBonusRow(
                                row.slotIdx,
                                "skillName",
                                e.target.value
                              )
                            }
                            className="flex-1"
                          />
                          <span className="text-sm text-zinc-400">
                            pts
                          </span>
                          <Input
                            type="number"
                            min={0}
                            value={row.points}
                            onChange={(e) =>
                              updateBonusRow(
                                row.slotIdx,
                                "points",
                                e.target.value
                              )
                            }
                            className="w-20"
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
                  <div className="rounded-lg border border-white/15 bg-white/5 p-4">
                    <div className="grid gap-2">
                      {specialRows.map((row) => (
                        <div
                          key={row.slotIdx}
                          className="flex items-center gap-3"
                        >
                          <Input
                            placeholder="Special ability"
                            value={row.skillName}
                            onChange={(e) =>
                              updateSpecialRow(
                                row.slotIdx,
                                "skillName",
                                e.target.value
                              )
                            }
                            className="flex-1"
                          />
                          <span className="text-sm text-zinc-400">
                            pts
                          </span>
                          <Input
                            type="number"
                            min={0}
                            value={row.points}
                            onChange={(e) =>
                              updateSpecialRow(
                                row.slotIdx,
                                "points",
                                e.target.value
                              )
                            }
                            className="w-20"
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
        </Card>
      </section>
    </main>
  );
}
