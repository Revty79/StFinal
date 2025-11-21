"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GradientText } from "@/components/GradientText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { Input } from "@/components/Input";
import { Tabs } from "@/components/Tabs";

type PlaneTabKey = "identity" | "laws" | "time" | "connectivity" | "realms";

const PLANE_TABS: { id: PlaneTabKey; label: string }[] = [
  { id: "identity", label: "Identity" },
  { id: "laws", label: "Laws & Environment" },
  { id: "time", label: "Time, Magic & Souls" },
  { id: "connectivity", label: "Connectivity & Gameplay" },
  { id: "realms", label: "Realms & Cards" },
];

const PLANE_CATEGORY_OPTIONS = [
  "Physical",
  "Metaphysical",
  "Energetic / Alchemical",
  "Shadow / Reflection / Mirror",
  "Artificial / Engineered",
  "Transitional / Boundary",
  "Absolute / Prime / Root",
] as const;
type PlaneCategory = (typeof PLANE_CATEGORY_OPTIONS)[number];

const STIR_OPTIONS = [
  "Stable",
  "Semi-Stable",
  "Fluid",
  "Chaotic",
  "Anti-Plane",
] as const;
type StirType = (typeof STIR_OPTIONS)[number];

const PHYSICALITY_OPTIONS = [
  "Solid",
  "Semi-Phased",
  "Ethereal",
  "Conceptual",
  "Non-Physical",
] as const;

const RULE_LOGIC_OPTIONS = [
  "Causal",
  "Acausal",
  "Symbolic",
  "Dreamlike",
  "Mechanical",
] as const;

const TIME_FLOW_VS_COSMOS_OPTIONS = [
  "Same Rate",
  "Slower (Linear)",
  "Faster (Linear)",
  "Timeless",
  "Fragmented",
  "Cyclic",
  "Non-Linear",
  "Custom",
] as const;

const MAGIC_AVAILABILITY_OPTIONS = [
  "Normal",
  "Suppressed",
  "Amplified",
  "Forbidden",
  "Only Specific Types",
] as const;

const MAGIC_DENSITY_OPTIONS = [
  "Very Low",
  "Low",
  "Normal",
  "High",
  "Overcharged",
] as const;

const SOUL_TRAFFIC_OPTIONS = [
  "None",
  "Normal",
  "Heavy",
  "One-Way",
  "Trapped",
  "Reincarnation Loop",
  "Drains to Other Plane",
] as const;

const AFTERLIFE_FUNCTION_OPTIONS = [
  "Not an Afterlife",
  "Staging Area",
  "Full Afterlife",
  "Final Destination",
] as const;

const CONSCIOUSNESS_TRAVEL_OPTIONS = [
  "No Dream/Astral Access",
  "Dream Only",
  "Astral Only",
  "Both (Normal Difficulty)",
  "Both (Easy Access)",
  "Only via Possession / Override",
  "Only via Artifacts / Tech",
  "Only to Native Beings",
] as const;

const ACCESSIBILITY_OPTIONS = [
  "Never",
  "Rarely",
  "Sometimes",
  "Often",
  "Always",
] as const;

const BORDER_TYPE_OPTIONS = [
  "Hard Wall",
  "Soft Fade",
  "Infinite",
  "Edge of Nothing",
  "Nested",
  "Unknown",
] as const;

const RESTING_BEHAVIOR_OPTIONS = [
  "Normal",
  "Harder",
  "Easier",
  "Short Only",
  "Long Only",
  "None",
] as const;

const MULTIPLIER_OPTIONS = [
  "0x",
  "0.5x",
  "0.75x",
  "1x",
  "1.25x",
  "1.5x",
  "2x",
  "Custom",
] as const;

type PlaneDetail = {
  id: string;
  cosmosId: string;
  name: string;
  cosmosName?: string;
  category?: PlaneCategory;
  subtype?: string;
  shortPitch?: string;
  stir?: StirType;
  structuralRoleTags?: string; // comma-separated for now
  description?: string;
  gmNotes?: string;
  themeKeywords?: string; // comma-separated

  // Laws & environment
  physicalityMode?: string;
  temperature?: string;
  pressure?: string;
  atmosphere?: string;

  gravityType?: string;
  gravityMultiplier?: string;
  gravityNotes?: string;

  primaryElement?: string;
  secondaryElements?: string;
  dominantEnergyTypes?: string;
  damageBiasNotes?: string;

  ruleLogicMode?: string;
  environmentalQuirks?: string;

  // Time, magic & souls
  timeFlowVsCosmos?: string;
  timeRatio?: string;
  timeLoopsPossible?: boolean;
  backwardTimePockets?: boolean;
  temporalDeadZones?: boolean;
  fixedTimeRegions?: boolean;
  branchingTimelines?: boolean;
  timeNotes?: string;

  magicAvailability?: string;
  magicDensity?: string;
  favoredDisciplines?: string;
  hinderedDisciplines?: string;
  globalManaCostMultiplier?: string;
  globalMagicDifficultyMultiplier?: string;
  magicGlitches?: string;

  soulTraffic?: string;
  afterlifeFunction?: string;
  consciousnessTravel?: string;
  corruptionPurification?: string;
  cosmicSpecialNotes?: string;

  // Connectivity & gameplay
  accessibleToPCs?: string;
  entryMethods?: string;
  exitMethods?: string;
  borderType?: string;
  knownLinksNotes?: string;

  travelFatigue?: string;
  restingBehavior?: string;
  healingModifier?: string;
  deathAndDyingRules?: string;
  explorationNotes?: string;
  encounterToneTags?: string;
  gmTips?: string;
};

export default function PlaneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const planeid = params.planeid as string;

  const [activeTab, setActiveTab] = useState<PlaneTabKey>("identity");
  const [plane, setPlane] = useState<PlaneDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState("");

  // Fetch cosmos and extract the specific plane
  useEffect(() => {
    async function fetchPlane() {
      try {
        const response = await fetch(`/api/worldbuilder/cosmos/${slug}`);
        if (response.ok) {
          const cosmosData = await response.json();
          
          // Load planes from localStorage (until DB is ready)
          const storedPlanes = localStorage.getItem(`cosmos_${slug}_planes`);
          let planes = [];
          if (storedPlanes) {
            try {
              planes = JSON.parse(storedPlanes);
            } catch (e) {
              console.error('Failed to parse stored planes:', e);
            }
          }
          
          console.log('Cosmos data:', cosmosData);
          console.log('Looking for plane ID:', planeid);
          console.log('Available planes:', planes);
          
          // Find the specific plane in the planes array
          const foundPlane = planes.find((p: any) => p.id === planeid);
          console.log('Found plane:', foundPlane);
          
          if (foundPlane) {
            setPlane({
              ...foundPlane,
              cosmosId: cosmosData.id,
              cosmosName: cosmosData.name,
            });
          } else {
            console.warn('Plane not found, redirecting to cosmos');
            router.push(`/worldbuilder/cosmos/${slug}`);
          }
        } else if (response.status === 404) {
          router.push("/worldbuilder/cosmos");
        }
      } catch (error) {
        console.error("Failed to fetch plane:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlane();
  }, [slug, planeid, router]);

  // Escape key: back out to cosmos detail page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push(`/worldbuilder/cosmos/${slug}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slug, router]);

  function updatePlane(patch: Partial<PlaneDetail>) {
    if (!plane) return;
    const updated = { ...plane, ...patch };
    setPlane(updated);
    // Don't auto-save - only save when user clicks Save button
  }

  async function savePlaneToAPI(data: PlaneDetail) {
    setIsSaving(true);
    setSavingStatus("Saving...");
    try {
      // Remove cosmosId and cosmosName from the data before saving
      const { cosmosId, cosmosName, ...planeDataToSave } = data;
      
      // Load current planes from localStorage
      const storedPlanes = localStorage.getItem(`cosmos_${slug}_planes`);
      let planes = [];
      if (storedPlanes) {
        try {
          planes = JSON.parse(storedPlanes);
        } catch (e) {
          console.error('Failed to parse stored planes:', e);
        }
      }
      
      // Update the specific plane in the array
      const updatedPlanes = planes.map((p: any) => 
        p.id === planeid ? planeDataToSave : p
      );
      
      // Save back to localStorage (until DB is ready)
      localStorage.setItem(`cosmos_${slug}_planes`, JSON.stringify(updatedPlanes));
      
      setSavingStatus("Saved");
      setTimeout(() => setSavingStatus(""), 2000);
    } catch (error) {
      console.error("Save error:", error);
      setSavingStatus("Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  async function savePlane() {
    if (!plane) return;
    await savePlaneToAPI(plane);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen px-6 py-10">
        <p className="text-zinc-400">Loading plane...</p>
      </main>
    );
  }

  if (!plane) {
    return (
      <main className="min-h-screen px-6 py-10">
        <p className="text-zinc-400">Plane not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <GradientText
              as="h1"
              variant="title"
              glow
              className="font-evanescent text-4xl sm:text-5xl tracking-tight"
            >
              {plane.name}
            </GradientText>
            <p className="mt-1 text-sm text-zinc-300/90 max-w-2xl">
              {plane.shortPitch ??
                "Macro-layer of existence: law, not land. Define how reality behaves here."}
            </p>
            {plane.cosmosName && (
              <p className="mt-1 text-xs text-zinc-400">
                Cosmos: <span className="font-semibold">{plane.cosmosName}</span>
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end items-center">
            {savingStatus && (
              <span
                className={`text-sm ${
                  isSaving
                    ? "text-zinc-400"
                    : savingStatus.includes("Failed")
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {savingStatus}
              </span>
            )}
            <Link href={`/worldbuilder/cosmos/${slug}`}>
              <Button variant="secondary" size="sm">
                ← Back to Cosmos
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={savePlane}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Tabs
            tabs={PLANE_TABS}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as PlaneTabKey)}
          />
        </div>
      </header>

      {/* Main content */}
      <section className="max-w-7xl mx-auto">
        <Card
          padded={false}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl"
        >
          <div className="space-y-6">
            {/* TAB 1 — IDENTITY */}
            {activeTab === "identity" && (
              <div className="space-y-4">
                <FormField label="Plane Name" htmlFor="plane-name">
                  <Input
                    id="plane-name"
                    value={plane.name}
                    onChange={(e) => updatePlane({ name: e.target.value })}
                  />
                </FormField>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Category" htmlFor="plane-category">
                    <select
                      id="plane-category"
                      className="w-full rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                      value={plane.category ?? ""}
                      onChange={(e) =>
                        updatePlane({
                          category: e.target.value as PlaneCategory,
                        })
                      }
                    >
                      <option value="">Select category...</option>
                      {PLANE_CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Subtype"
                    htmlFor="plane-subtype"
                    description="Material, Fire, Astral, Divine, Shadow, Simulation, Origin, etc."
                  >
                    <Input
                      id="plane-subtype"
                      value={plane.subtype ?? ""}
                      onChange={(e) =>
                        updatePlane({ subtype: e.target.value })
                      }
                    />
                  </FormField>
                </div>

                <FormField
                  label="Short Pitch"
                  htmlFor="plane-pitch"
                  description="One or two sentences capturing what this plane is."
                >
                  <textarea
                    id="plane-pitch"
                    className="w-full min-h-[60px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={plane.shortPitch ?? ""}
                    onChange={(e) =>
                      updatePlane({ shortPitch: e.target.value })
                    }
                  />
                </FormField>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Structural Integrity Rating (STIR)"
                    htmlFor="plane-stir"
                  >
                    <select
                      id="plane-stir"
                      className="w-full rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                      value={plane.stir ?? ""}
                      onChange={(e) =>
                        updatePlane({
                          stir: e.target.value as StirType,
                        })
                      }
                    >
                      <option value="">Select STIR...</option>
                      {STIR_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Structural Role Tags"
                    htmlFor="plane-role-tags"
                    description="Comma-separated tags: Core, Peripheral, Anchor, Transit, Sandbox..."
                  >
                    <Input
                      id="plane-role-tags"
                      value={plane.structuralRoleTags ?? ""}
                      onChange={(e) =>
                        updatePlane({ structuralRoleTags: e.target.value })
                      }
                      placeholder="Core, Anchor"
                    />
                  </FormField>
                </div>

                <FormField
                  label="Full Description / Lore"
                  htmlFor="plane-description"
                >
                  <textarea
                    id="plane-description"
                    className="w-full min-h-[140px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={plane.description ?? ""}
                    onChange={(e) =>
                      updatePlane({ description: e.target.value })
                    }
                  />
                </FormField>

                <FormField
                  label="GM-Only Notes"
                  htmlFor="plane-gm-notes"
                  description="Internal creator-facing notes that players won't see."
                >
                  <textarea
                    id="plane-gm-notes"
                    className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={plane.gmNotes ?? ""}
                    onChange={(e) => updatePlane({ gmNotes: e.target.value })}
                  />
                </FormField>

                <FormField
                  label="Theme Keywords"
                  htmlFor="plane-themes"
                  description="Comma-separated mood or flavor tags (fiery, dreamlike, mechanical...)."
                >
                  <Input
                    id="plane-themes"
                    value={plane.themeKeywords ?? ""}
                    onChange={(e) =>
                      updatePlane({ themeKeywords: e.target.value })
                    }
                  />
                </FormField>
              </div>
            )}

            {/* TAB 2 — LAWS & ENVIRONMENT */}
            {activeTab === "laws" && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Physicality Mode"
                    htmlFor="plane-physicality"
                  >
                    <select
                      id="plane-physicality"
                      className="w-full rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                      value={plane.physicalityMode ?? ""}
                      onChange={(e) =>
                        updatePlane({ physicalityMode: e.target.value })
                      }
                    >
                      <option value="">Select mode...</option>
                      {PHYSICALITY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Temperature" htmlFor="plane-temperature">
                    <Input
                      id="plane-temperature"
                      value={plane.temperature ?? ""}
                      onChange={(e) =>
                        updatePlane({ temperature: e.target.value })
                      }
                      placeholder="Normal, Cold, Hot, Extreme..."
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Pressure" htmlFor="plane-pressure">
                    <Input
                      id="plane-pressure"
                      value={plane.pressure ?? ""}
                      onChange={(e) =>
                        updatePlane({ pressure: e.target.value })
                      }
                      placeholder="Vacuum, Low, Normal, High, Crushing..."
                    />
                  </FormField>

                  <FormField label="Atmosphere" htmlFor="plane-atmosphere">
                    <Input
                      id="plane-atmosphere"
                      value={plane.atmosphere ?? ""}
                      onChange={(e) =>
                        updatePlane({ atmosphere: e.target.value })
                      }
                      placeholder="Breathable, Toxic, Vacuum, Custom..."
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField label="Gravity Type" htmlFor="plane-gravity-type">
                    <Input
                      id="plane-gravity-type"
                      value={plane.gravityType ?? ""}
                      onChange={(e) =>
                        updatePlane({ gravityType: e.target.value })
                      }
                      placeholder="Normal, Light, Heavy, Directional, None..."
                    />
                  </FormField>

                  <FormField
                    label="Gravity Multiplier"
                    htmlFor="plane-gravity-multiplier"
                    description="0x, 0.5x, 1x, 2x, etc."
                  >
                    <Input
                      id="plane-gravity-multiplier"
                      value={plane.gravityMultiplier ?? ""}
                      onChange={(e) =>
                        updatePlane({ gravityMultiplier: e.target.value })
                      }
                    />
                  </FormField>

                  <FormField
                    label="Gravity Notes"
                    htmlFor="plane-gravity-notes"
                  >
                    <Input
                      id="plane-gravity-notes"
                      value={plane.gravityNotes ?? ""}
                      onChange={(e) =>
                        updatePlane({ gravityNotes: e.target.value })
                      }
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    label="Primary Elemental Alignment"
                    htmlFor="plane-primary-element"
                  >
                    <Input
                      id="plane-primary-element"
                      value={plane.primaryElement ?? ""}
                      onChange={(e) =>
                        updatePlane({ primaryElement: e.target.value })
                      }
                      placeholder="Fire, Water, Earth, Shadow, Data..."
                    />
                  </FormField>

                  <FormField
                    label="Secondary Elements"
                    htmlFor="plane-secondary-elements"
                    description="Comma-separated."
                  >
                    <Input
                      id="plane-secondary-elements"
                      value={plane.secondaryElements ?? ""}
                      onChange={(e) =>
                        updatePlane({ secondaryElements: e.target.value })
                      }
                    />
                  </FormField>

                  <FormField
                    label="Dominant Energy Types"
                    htmlFor="plane-dominant-energies"
                    description="Comma-separated (radiant, necrotic, electric...)."
                  >
                    <Input
                      id="plane-dominant-energies"
                      value={plane.dominantEnergyTypes ?? ""}
                      onChange={(e) =>
                        updatePlane({ dominantEnergyTypes: e.target.value })
                      }
                    />
                  </FormField>
                </div>

                <FormField
                  label="Damage Bias Notes"
                  htmlFor="plane-damage-bias"
                  description="How this plane treats damage types (e.g., Fire amplified, Cold vulnerable...)."
                >
                  <textarea
                    id="plane-damage-bias"
                    className="w-full min-h-[90px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={plane.damageBiasNotes ?? ""}
                    onChange={(e) =>
                      updatePlane({ damageBiasNotes: e.target.value })
                    }
                  />
                </FormField>

                <FormField
                  label="Rule Logic Mode"
                  htmlFor="plane-rule-logic"
                  description="How cause and effect behaves here."
                >
                  <select
                    id="plane-rule-logic"
                    className="w-full rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                    value={plane.ruleLogicMode ?? ""}
                    onChange={(e) =>
                      updatePlane({ ruleLogicMode: e.target.value })
                    }
                  >
                    <option value="">Select logic...</option>
                    {RULE_LOGIC_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Environmental Quirks"
                  htmlFor="plane-environmental-quirks"
                  description="Weird standing rules of reality (spoken lies turn to ash, shadows move on their own, etc.)."
                >
                  <textarea
                    id="plane-environmental-quirks"
                    className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={plane.environmentalQuirks ?? ""}
                    onChange={(e) =>
                      updatePlane({ environmentalQuirks: e.target.value })
                    }
                  />
                </FormField>
              </div>
            )}

            {/* TAB 3 — TIME, MAGIC & SOULS */}
            {activeTab === "time" && (
              <div className="space-y-4">
                <FormField
                  label="Time Flow vs Cosmos"
                  htmlFor="plane-time-flow"
                >
                  <select
                    id="plane-time-flow"
                    className="w-full rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                    value={plane.timeFlowVsCosmos ?? ""}
                    onChange={(e) =>
                      updatePlane({ timeFlowVsCosmos: e.target.value })
                    }
                  >
                    <option value="">Select behavior...</option>
                    {TIME_FLOW_VS_COSMOS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Approximate Time Ratio"
                  htmlFor="plane-time-ratio"
                  description='e.g., "1 hour here = 10 minutes material".'
                >
                  <Input
                    id="plane-time-ratio"
                    value={plane.timeRatio ?? ""}
                    onChange={(e) =>
                      updatePlane({ timeRatio: e.target.value })
                    }
                  />
                </FormField>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-zinc-200">
                      Time Anomalies
                    </p>
                    <div className="space-y-1 text-xs text-zinc-200">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={plane.timeLoopsPossible ?? false}
                          onChange={(e) =>
                            updatePlane({ timeLoopsPossible: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-white/20 bg-black/30 text-violet-500 focus:ring-violet-500/50"
                        />
                        <span>Time loops possible</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={plane.backwardTimePockets ?? false}
                          onChange={(e) =>
                            updatePlane({
                              backwardTimePockets: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-white/20 bg-black/30 text-violet-500 focus:ring-violet-500/50"
                        />
                        <span>Backward time pockets</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={plane.temporalDeadZones ?? false}
                          onChange={(e) =>
                            updatePlane({
                              temporalDeadZones: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-white/20 bg-black/30 text-violet-500 focus:ring-violet-500/50"
                        />
                        <span>Temporal dead zones</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-zinc-200">
                      Structural Weirdness
                    </p>
                    <div className="space-y-1 text-xs text-zinc-200">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={plane.fixedTimeRegions ?? false}
                          onChange={(e) =>
                            updatePlane({
                              fixedTimeRegions: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-white/20 bg-black/30 text-violet-500 focus:ring-violet-500/50"
                        />
                        <span>Fixed time regions</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={plane.branchingTimelines ?? false}
                          onChange={(e) =>
                            updatePlane({
                              branchingTimelines: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-white/20 bg-black/30 text-violet-500 focus:ring-violet-500/50"
                        />
                        <span>Branching timelines</span>
                      </label>
                    </div>
                  </div>
                </div>

                <FormField label="Time Notes" htmlFor="plane-time-notes">
                  <textarea
                    id="plane-time-notes"
                    className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={plane.timeNotes ?? ""}
                    onChange={(e) =>
                      updatePlane({ timeNotes: e.target.value })
                    }
                  />
                </FormField>

                <div className="pt-2 border-t border-white/10 space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Magic Behavior
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      label="Magic Availability"
                      htmlFor="plane-magic-availability"
                    >
                      <select
                        id="plane-magic-availability"
                        className="w-full rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                        value={plane.magicAvailability ?? ""}
                        onChange={(e) =>
                          updatePlane({
                            magicAvailability: e.target.value,
                          })
                        }
                      >
                        <option value="">Select...</option>
                        {MAGIC_AVAILABILITY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField
                      label="Magic Density"
                      htmlFor="plane-magic-density"
                    >
                      <select
                        id="plane-magic-density"
                        className="w-full rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                        value={plane.magicDensity ?? ""}
                        onChange={(e) =>
                          updatePlane({
                            magicDensity: e.target.value,
                          })
                        }
                      >
                        <option value="">Select...</option>
                        {MAGIC_DENSITY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      label="Favored Disciplines"
                      htmlFor="plane-favored-disciplines"
                      description="Comma-separated list of magic spheres/schools that are easier here."
                    >
                      <Input
                        id="plane-favored-disciplines"
                        value={plane.favoredDisciplines ?? ""}
                        onChange={(e) =>
                          updatePlane({
                            favoredDisciplines: e.target.value,
                          })
                        }
                      />
                    </FormField>

                    <FormField
                      label="Hindered Disciplines"
                      htmlFor="plane-hindered-disciplines"
                      description="Comma-separated list that are harder here."
                    >
                      <Input
                        id="plane-hindered-disciplines"
                        value={plane.hinderedDisciplines ?? ""}
                        onChange={(e) =>
                          updatePlane({
                            hinderedDisciplines: e.target.value,
                          })
                        }
                      />
                    </FormField>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      label="Global Mana Cost Multiplier"
                      htmlFor="plane-mana-multiplier"
                    >
                      <select
                        id="plane-mana-multiplier"
                        className="w-full rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                        value={plane.globalManaCostMultiplier ?? ""}
                        onChange={(e) =>
                          updatePlane({
                            globalManaCostMultiplier: e.target.value,
                          })
                        }
                      >
                        <option value="">Select...</option>
                        {MULTIPLIER_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField
                      label="Global Magic Difficulty Multiplier"
                      htmlFor="plane-difficulty-multiplier"
                    >
                      <select
                        id="plane-difficulty-multiplier"
                        className="w-full rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                        value={plane.globalMagicDifficultyMultiplier ?? ""}
                        onChange={(e) =>
                          updatePlane({
                            globalMagicDifficultyMultiplier: e.target.value,
                          })
                        }
                      >
                        <option value="">Select...</option>
                        {MULTIPLIER_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <FormField
                    label="Magic Glitches / Special Rules"
                    htmlFor="plane-magic-glitches"
                  >
                    <textarea
                      id="plane-magic-glitches"
                      className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      value={plane.magicGlitches ?? ""}
                      onChange={(e) =>
                        updatePlane({ magicGlitches: e.target.value })
                      }
                    />
                  </FormField>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Souls & Afterlife
                  </h3>

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField label="Soul Traffic" htmlFor="plane-soul-traffic">
                      <select
                        id="plane-soul-traffic"
                        className="w-full rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                        value={plane.soulTraffic ?? ""}
                        onChange={(e) =>
                          updatePlane({ soulTraffic: e.target.value })
                        }
                      >
                        <option value="">Select...</option>
                        {SOUL_TRAFFIC_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField
                      label="Afterlife Function"
                      htmlFor="plane-afterlife-function"
                    >
                      <select
                        id="plane-afterlife-function"
                        className="w-full rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                        value={plane.afterlifeFunction ?? ""}
                        onChange={(e) =>
                          updatePlane({
                            afterlifeFunction: e.target.value,
                          })
                        }
                      >
                        <option value="">Select...</option>
                        {AFTERLIFE_FUNCTION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField
                      label="Consciousness Travel"
                      htmlFor="plane-consciousness-travel"
                    >
                      <select
                        id="plane-consciousness-travel"
                        className="w-full rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                        value={plane.consciousnessTravel ?? ""}
                        onChange={(e) =>
                          updatePlane({
                            consciousnessTravel: e.target.value,
                          })
                        }
                      >
                        <option value="">Select...</option>
                        {CONSCIOUSNESS_TRAVEL_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <FormField
                    label="Corruption / Purification Effects"
                    htmlFor="plane-corruption-purification"
                  >
                    <textarea
                      id="plane-corruption-purification"
                      className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      value={plane.corruptionPurification ?? ""}
                      onChange={(e) =>
                        updatePlane({
                          corruptionPurification: e.target.value,
                        })
                      }
                    />
                  </FormField>

                  <FormField
                    label="Cosmic Anchor / End-Cycle / Glitch Logic (for Origin / Terminal / Simulation)"
                    htmlFor="plane-cosmic-special"
                  >
                    <textarea
                      id="plane-cosmic-special"
                      className="w-full min-h-[80px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      value={plane.cosmicSpecialNotes ?? ""}
                      onChange={(e) =>
                        updatePlane({ cosmicSpecialNotes: e.target.value })
                      }
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* TAB 4 — CONNECTIVITY & GAMEPLAY */}
            {activeTab === "connectivity" && (
              <div className="space-y-4">
                <FormField
                  label="Is Plane Accessible to PCs?"
                  htmlFor="plane-access"
                >
                  <select
                    id="plane-access"
                    className="w-full rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                    value={plane.accessibleToPCs ?? ""}
                    onChange={(e) =>
                      updatePlane({ accessibleToPCs: e.target.value })
                    }
                  >
                    <option value="">Select...</option>
                    {ACCESSIBILITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Entry Methods"
                    htmlFor="plane-entry-methods"
                    description="Comma-separated (Portal, Ritual, Death, Dreaming, Random Tear, Tech, Divine Intervention...)."
                  >
                    <Input
                      id="plane-entry-methods"
                      value={plane.entryMethods ?? ""}
                      onChange={(e) =>
                        updatePlane({ entryMethods: e.target.value })
                      }
                    />
                  </FormField>

                  <FormField
                    label="Exit Methods"
                    htmlFor="plane-exit-methods"
                    description="Comma-separated; can differ from entry."
                  >
                    <Input
                      id="plane-exit-methods"
                      value={plane.exitMethods ?? ""}
                      onChange={(e) =>
                        updatePlane({ exitMethods: e.target.value })
                      }
                    />
                  </FormField>
                </div>

                <FormField label="Border Type" htmlFor="plane-border-type">
                  <select
                    id="plane-border-type"
                    className="w-full rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                    value={plane.borderType ?? ""}
                    onChange={(e) =>
                      updatePlane({ borderType: e.target.value })
                    }
                  >
                    <option value="">Select...</option>
                    {BORDER_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Known Links"
                  htmlFor="plane-known-links"
                  description="Freeform notes about links to other planes (or future IDs once Realm/Plane linking exists)."
                >
                  <textarea
                    id="plane-known-links"
                    className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={plane.knownLinksNotes ?? ""}
                    onChange={(e) =>
                      updatePlane({ knownLinksNotes: e.target.value })
                    }
                  />
                </FormField>

                <div className="pt-4 border-t border-white/10 space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Core Gameplay Effects
                  </h3>

                  <FormField
                    label="Travel Fatigue"
                    htmlFor="plane-travel-fatigue"
                    description="How travel here wears on characters."
                  >
                    <textarea
                      id="plane-travel-fatigue"
                      className="w-full min-h-[70px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      value={plane.travelFatigue ?? ""}
                      onChange={(e) =>
                        updatePlane({ travelFatigue: e.target.value })
                      }
                    />
                  </FormField>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      label="Resting Behavior"
                      htmlFor="plane-resting-behavior"
                    >
                      <select
                        id="plane-resting-behavior"
                        className="w-full rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                        value={plane.restingBehavior ?? ""}
                        onChange={(e) =>
                          updatePlane({
                            restingBehavior: e.target.value,
                          })
                        }
                      >
                        <option value="">Select...</option>
                        {RESTING_BEHAVIOR_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField
                      label="Healing Modifier"
                      htmlFor="plane-healing-modifier"
                      description="Use the same multipliers as magic, or describe in text."
                    >
                      <select
                        id="plane-healing-modifier"
                        className="w-full rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                        value={plane.healingModifier ?? ""}
                        onChange={(e) =>
                          updatePlane({ healingModifier: e.target.value })
                        }
                      >
                        <option value="">Select...</option>
                        {MULTIPLIER_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <FormField
                    label="Death & Dying Rules"
                    htmlFor="plane-death-rules"
                  >
                    <textarea
                      id="plane-death-rules"
                      className="w-full min-h-[90px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      value={plane.deathAndDyingRules ?? ""}
                      onChange={(e) =>
                        updatePlane({
                          deathAndDyingRules: e.target.value,
                        })
                      }
                    />
                  </FormField>

                  <FormField
                    label="Exploration Notes"
                    htmlFor="plane-exploration-notes"
                    description="Navigation quirks, perception penalties, traversal hazards, etc."
                  >
                    <textarea
                      id="plane-exploration-notes"
                      className="w-full min-h-[90px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      value={plane.explorationNotes ?? ""}
                      onChange={(e) =>
                        updatePlane({
                          explorationNotes: e.target.value,
                        })
                      }
                    />
                  </FormField>

                  <FormField
                    label="Suggested Encounter Tone Tags"
                    htmlFor="plane-encounter-tone"
                    description="Comma-separated (horror, epic, surreal, grim, heroic, etc.)."
                  >
                    <Input
                      id="plane-encounter-tone"
                      value={plane.encounterToneTags ?? ""}
                      onChange={(e) =>
                        updatePlane({
                          encounterToneTags: e.target.value,
                        })
                      }
                    />
                  </FormField>

                  <FormField label="GM Tips & Hooks" htmlFor="plane-gm-tips">
                    <textarea
                      id="plane-gm-tips"
                      className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      value={plane.gmTips ?? ""}
                      onChange={(e) =>
                        updatePlane({ gmTips: e.target.value })
                      }
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* TAB 5 — REALMS & CARDS */}
            {activeTab === "realms" && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-200">
                  This tab will eventually show Realms and Worlds that live inside
                  this Plane, and control how Realm/Plane cards are generated.
                  For now, use it as a planning scratchpad.
                </p>

                <FormField
                  label="Realm & World Notes"
                  htmlFor="plane-realms-notes"
                  description="Any ideas for Realms, afterlives, dream zones, or worlds that will sit inside this plane."
                >
                  <textarea
                    id="plane-realms-notes"
                    className="w-full min-h-[160px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={plane.knownLinksNotes ?? ""}
                    onChange={(e) =>
                      updatePlane({ knownLinksNotes: e.target.value })
                    }
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
