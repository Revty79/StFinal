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

type CosmosTabKey = "overview" | "rules" | "time" | "planes";

const TIME_FLOW_OPTIONS = [
  "linear",
  "cyclical",
  "looping",
  "branching",
  "static",
  "beyondTime",
] as const;
type TimeFlowType = (typeof TIME_FLOW_OPTIONS)[number];

const REALITY_RIGIDITY_OPTIONS = ["rigid", "balanced", "fluid"] as const;
type RealityRigidity = (typeof REALITY_RIGIDITY_OPTIONS)[number];

const PLANE_TYPE_OPTIONS = [
  "Material",
  "Astral",
  "Void",
  "Divine",
  "Dream",
  "Shadow",
  "Elemental",
  "Custom / Other",
] as const;
type PlaneTypeOption = (typeof PLANE_TYPE_OPTIONS)[number];

type PlaneSummary = {
  id: string;
  name: string;
  type: string;
  description?: string;
};

type CosmosDetail = {
  id: string;
  slug: string;
  name: string;
  shortPitch: string;
  description?: string;
  originStory?: string;
  cosmicOperationNotes?: string;
  designerNotes?: string;
  existenceOrigin?: string;
  energyConsciousnessFramework?: string;
  cosmicConstants?: string;
  realityInteractionFramework?: string;
  planeTravelPossible?: boolean;
  // Guided fields
  hasCosmicCalendar?: boolean;
  timeFlowType?: TimeFlowType;
  realityRigidity?: RealityRigidity;

  cosmicCalendarName?: string;
  cyclesEpochsAges?: string;
  timeFlowRules?: string;
  majorCosmicEvents?: string;

  // Extra helper for people to just brain-dump
  brainstormNotes?: string;

  // Planes (simple summary list for this tab)
  planes?: PlaneSummary[];
};

const COSMOS_TABS: { id: CosmosTabKey; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "rules", label: "Cosmic Rules" },
  { id: "time", label: "Cosmic Time & Cycles" },
  { id: "planes", label: "Planes of Existence" },
];

// Super-simple starter presets to help people not start from a blank page
const COSMOS_PRESETS = [
  {
    id: "mythic",
    label: "Mythic Fantasy Cosmos",
    pitch: "A myth-woven cosmos where gods, mortals, and monsters share the same sky.",
    description:
      "A mythic cosmos built from stories, oaths, and legends. Gods walk among mortals, the stars are the scars of ancient wars, and every realm is tied together by shared myths that echo across worlds.",
  },
  {
    id: "dreamlike",
    label: "Dreamlike / Surreal Cosmos",
    pitch: "A dreamlike cosmos where meaning shifts, but emotional truth is constant.",
    description:
      "A fluid, surreal cosmos where locations and forms change, but emotional truths hold everything together. Dreams and waking realms bleed into each other, and cause-and-effect is guided more by symbolism than physics.",
  },
  {
    id: "simulation",
    label: "Simulation / Engineered Cosmos",
    pitch: "An engineered cosmos running inside a greater unknown reality.",
    description:
      "A constructed cosmos designed as a contained system, possibly a simulation or experiment. Its laws are precise and consistent, but faint glitches and anomalies hint at the presence of a higher layer beyond its bounds.",
  },
] as const;

/**
 * Small helper for showing collapsible example snippets
 * under dense metaphysical fields.
 */
function ExampleBlock({ examples }: { examples: string[] }) {
  const [open, setOpen] = useState(false);

  if (!examples.length) return null;

  return (
    <div className="mt-2 text-xs text-zinc-300/80">
      <button
        type="button"
        className="underline-offset-2 hover:underline text-zinc-400"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Hide examples" : "Show examples"}
      </button>
      {open && (
        <ul className="mt-2 space-y-1 bg-black/30 border border-white/10 rounded-lg p-3">
          {examples.map((ex, i) => (
            <li
              key={i}
              className="font-mono whitespace-pre-wrap text-[11px] leading-snug text-zinc-200"
            >
              {ex}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CosmosDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [activeTab, setActiveTab] = useState<CosmosTabKey>("overview");
  const [cosmos, setCosmos] = useState<CosmosDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch cosmos data on mount
  useEffect(() => {
    async function fetchCosmos() {
      try {
        const response = await fetch(`/api/worldbuilder/cosmos/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setCosmos(data);
        } else if (response.status === 404) {
          router.push('/worldbuilder/cosmos');
        }
      } catch (error) {
        console.error('Failed to fetch cosmos:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCosmos();
  }, [slug, router]);

  const [savingStatus, setSavingStatus] = useState<string>("");

  // Plane modal state
  const [isPlaneModalOpen, setIsPlaneModalOpen] = useState(false);
  const [planeName, setPlaneName] = useState("");
  const [planeTypeChoice, setPlaneTypeChoice] =
    useState<PlaneTypeOption>("Material");
  const [planeCustomType, setPlaneCustomType] = useState("");
  const [planeDescription, setPlaneDescription] = useState("");

  // Escape key handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isPlaneModalOpen) {
          setIsPlaneModalOpen(false);
        } else {
          router.push("/worldbuilder/cosmos");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, isPlaneModalOpen]);

  function updateCosmos(patch: Partial<CosmosDetail>) {
    if (!cosmos) return;
    const updated = { ...cosmos, ...patch };
    setCosmos(updated);
    
    // Auto-save changes
    saveCosmosToAPI(updated);
  }

  async function saveCosmosToAPI(data: CosmosDetail) {
    setIsSaving(true);
    setSavingStatus("Saving...");
    try {
      const response = await fetch(`/api/worldbuilder/cosmos/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setSavingStatus("Saved");
        setTimeout(() => setSavingStatus(""), 2000);
      } else {
        setSavingStatus("Failed to save");
      }
    } catch (error) {
      console.error('Save error:', error);
      setSavingStatus("Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  function resetPlaneDraft() {
    setPlaneName("");
    setPlaneTypeChoice("Material");
    setPlaneCustomType("");
    setPlaneDescription("");
  }

  function openPlaneModal() {
    resetPlaneDraft();
    setIsPlaneModalOpen(true);
  }

  function addPlane() {
    if (!cosmos) return;
    if (!planeName.trim()) {
      alert("Please enter a plane name.");
      return;
    }

    const finalType =
      planeTypeChoice === "Custom / Other"
        ? planeCustomType.trim() || "Custom"
        : planeTypeChoice;

    const newPlane: PlaneSummary = {
      id:
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `plane_${Date.now()}_${Math.random().toString(16).slice(2)}`),
      name: planeName.trim(),
      type: finalType,
      description: planeDescription.trim() || undefined,
    };

    const existingPlanes = cosmos.planes ?? [];
    updateCosmos({ planes: [...existingPlanes, newPlane] });
    setIsPlaneModalOpen(false);
    resetPlaneDraft();
  }

  function deletePlane(id: string) {
    if (!cosmos) return;
    const confirmed = window.confirm(
      "Delete this plane from this cosmos? You can always recreate it later."
    );
    if (!confirmed) return;

    const remaining = (cosmos.planes ?? []).filter((p) => p.id !== id);
    updateCosmos({ planes: remaining });
  }

  async function saveCosmos() {
    if (!cosmos) return;
    await saveCosmosToAPI(cosmos);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen px-6 py-10">
        <p className="text-zinc-400">Loading cosmos...</p>
      </main>
    );
  }

  if (!cosmos) {
    return (
      <main className="min-h-screen px-6 py-10">
        <p className="text-zinc-400">Cosmos not found.</p>
      </main>
    );
  }

  const planes = cosmos.planes ?? [];

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
              {cosmos.name}
            </GradientText>
            <p className="mt-1 text-sm text-zinc-300/90 max-w-2xl">
              {cosmos.shortPitch}
            </p>
          </div>

          <div className="flex gap-3 justify-end items-center">
            {savingStatus && (
              <span className={`text-sm ${isSaving ? 'text-zinc-400' : savingStatus.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
                {savingStatus}
              </span>
            )}
            <Link href="/worldbuilder/cosmos">
              <Button variant="secondary" size="sm">
                ← Back to Cosmos
              </Button>
            </Link>
            <Button variant="primary" size="sm" onClick={saveCosmos} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Tabs
            tabs={COSMOS_TABS}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as CosmosTabKey)}
          />
        </div>
      </header>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto">
        <Card
          padded={false}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl"
        >
          <div className="space-y-6">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                {/* Quick Start */}
                <div className="mb-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200">
                  <p className="font-semibold mb-1">Quick start for this cosmos</p>
                  <ul className="list-disc list-inside text-zinc-300/90 space-y-1 text-xs sm:text-sm">
                    <li>
                      You <strong>do not</strong> have to fill everything out right now. A few
                      lines is enough to start.
                    </li>
                    <li>
                      You can change anything later as your cosmos takes shape.
                    </li>
                    <li>
                      Stuck? Pick a preset below and tweak it instead of starting from a blank
                      page.
                    </li>
                  </ul>
                </div>

                {/* Presets */}
                <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-xs sm:text-sm text-zinc-200 space-y-2">
                  <p className="font-semibold">Cosmos presets (optional)</p>
                  <p className="text-zinc-300/90">
                    Click one to pre-fill a simple starting pitch and description. You can edit
                    everything after.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {COSMOS_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          updateCosmos({
                            shortPitch: preset.pitch,
                            description: preset.description,
                          })
                        }
                        className="px-3 py-2 rounded-xl border border-white/15 bg-black/40 text-left hover:border-violet-300 hover:bg-violet-600/20 transition text-xs sm:text-sm"
                      >
                        <div className="font-semibold text-zinc-100">
                          {preset.label}
                        </div>
                        <div className="text-[11px] sm:text-xs text-zinc-300/90 mt-1">
                          {preset.pitch}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <FormField label="Cosmos Name" htmlFor="cosmos-name">
                  <Input
                    id="cosmos-name"
                    value={cosmos.name}
                    onChange={(e) => updateCosmos({ name: e.target.value })}
                  />
                </FormField>

                <FormField
                  label="Description"
                  htmlFor="cosmos-desc"
                  description="Pure conceptual identity — what this cosmos is."
                >
                  <textarea
                    id="cosmos-desc"
                    className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={cosmos.description ?? ""}
                    onChange={(e) => updateCosmos({ description: e.target.value })}
                  />
                </FormField>

                <FormField
                  label="Origin Story (optional)"
                  htmlFor="cosmos-origin"
                  description="Mythic or narrative explanation of the cosmos's beginning. (Flavor, not mechanics.)"
                >
                  <textarea
                    id="cosmos-origin"
                    className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={cosmos.originStory ?? ""}
                    onChange={(e) => updateCosmos({ originStory: e.target.value })}
                    placeholder={[
                      "• Who or what tells this origin story?",
                      "• Key image or moment of creation.",
                      "• How do beings within the cosmos talk about its beginning?",
                    ].join("\n")}
                  />
                </FormField>

                <FormField
                  label="Cosmic Operation Notes (optional)"
                  htmlFor="cosmos-operation"
                  description="Metaphysical or mechanical explanation of how this cosmos functions. (Logic, not lore.)"
                >
                  <textarea
                    id="cosmos-operation"
                    className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={cosmos.cosmicOperationNotes ?? ""}
                    onChange={(e) =>
                      updateCosmos({ cosmicOperationNotes: e.target.value })
                    }
                    placeholder={[
                      "• High-level summary of how reality behaves here.",
                      "• Any unusual metaphysical rules (without going into spell rules).",
                      "• How this cosmos differs from a 'default' universe.",
                    ].join("\n")}
                  />
                </FormField>

                {/* Brainstorm scratchpad */}
                <FormField
                  label="Brainstorm Scratchpad (optional)"
                  htmlFor="cosmos-brainstorm"
                  description="Messy notes, loose ideas, or questions for later. This doesn’t have to be clean."
                >
                  <textarea
                    id="cosmos-brainstorm"
                    className="w-full min-h-[80px] rounded-lg border border-white/10 bg-neutral-950/40 px-3 py-2 text-xs text-zinc-100"
                    value={cosmos.brainstormNotes ?? ""}
                    onChange={(e) =>
                      updateCosmos({ brainstormNotes: e.target.value })
                    }
                    placeholder="Drop any half-formed ideas here so you don't lose them..."
                  />
                </FormField>

                <FormField
                  label="Designer Notes (Private)"
                  htmlFor="cosmos-designer"
                  description="Internal creator-facing notes."
                >
                  <textarea
                    id="cosmos-designer"
                    className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={cosmos.designerNotes ?? ""}
                    onChange={(e) => updateCosmos({ designerNotes: e.target.value })}
                  />
                </FormField>
              </div>
            )}

            {/* COSMIC RULES TAB */}
            {activeTab === "rules" && (
              <div className="space-y-6">
                {/* Quick Guide */}
                <div className="mb-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200">
                  <p className="font-semibold mb-1">How to use Cosmic Rules</p>
                  <ul className="list-disc list-inside text-zinc-300/90 space-y-1 text-xs sm:text-sm">
                    <li>
                      Describe how this cosmos <strong>fundamentally works</strong>, not story
                      flavor or game mechanics.
                    </li>
                    <li>
                      Don’t define spell lists, class features, or system crunch here — those
                      live in realms/systems.
                    </li>
                    <li>
                      Keep <strong>Cosmic Constants</strong> to a few lines you never want
                      broken.
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                    A. Existence Origin
                  </h3>
                  <FormField
                    label=""
                    htmlFor="cosmos-existence"
                    description="What is the primal origin or metaphysical beginning of this cosmos?"
                  >
                    <textarea
                      id="cosmos-existence"
                      className="w-full min-h-[110px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      value={cosmos.existenceOrigin ?? ""}
                      onChange={(e) =>
                        updateCosmos({ existenceOrigin: e.target.value })
                      }
                      placeholder={[
                        "• Origin type (e.g., resonance collapse, thought-form construct, failed simulation).",
                        "• Who/what (if anything) caused it.",
                        "• Is the true origin known, mythic, or disputed?",
                      ].join("\n")}
                    />
                    <ExampleBlock
                      examples={[
                        "A self-arising resonance bubble in an infinite metaphysical ocean that stabilized into laws.",
                        "The dream of a slumbering titan whose coherent thoughts crystallized into reality.",
                        "A sandbox simulation created by higher beings that slipped its constraints and became self-governing.",
                      ]}
                    />
                  </FormField>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                    B. Energy & Consciousness Framework
                  </h3>
                  <FormField
                    label=""
                    htmlFor="cosmos-energy"
                    description="Why energy/power/magic exists, what consciousness/soul is, and what happens after death at the universal level."
                  >
                    <textarea
                      id="cosmos-energy"
                      className="w-full min-h-[140px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      value={cosmos.energyConsciousnessFramework ?? ""}
                      onChange={(e) =>
                        updateCosmos({
                          energyConsciousnessFramework: e.target.value,
                        })
                      }
                      placeholder={[
                        "• Source of all energetic forces or magic.",
                        "• What a 'soul' or consciousness fundamentally is.",
                        "• Universal afterlife pattern (reincarnation, dissolution, journey, etc.).",
                      ].join("\n")}
                    />
                    <ExampleBlock
                      examples={[
                        "All energy is a slowed vibration of a single underlying song; souls are self-aware notes that return to the choir between incarnations.",
                        "Magic is a side-effect of information density; consciousness is the universe observing itself. After death, awareness diffuses but never fully disappears.",
                        "Souls are shards of a broken god; magic is the act of momentarily remembering that divinity. After death, shards rejoin the greater whole and may fracture again into new lives.",
                      ]}
                    />
                  </FormField>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                    C. Cosmic Constants (optional)
                  </h3>
                  <FormField
                    label=""
                    htmlFor="cosmos-constants"
                    description="Immutable, universal laws that nothing in this cosmos can break. Keep this section very minimal."
                  >
                    <textarea
                      id="cosmos-constants"
                      className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      value={cosmos.cosmicConstants ?? ""}
                      onChange={(e) =>
                        updateCosmos({ cosmicConstants: e.target.value })
                      }
                      placeholder={[
                        "• Energy cannot be created or destroyed, only transformed.",
                        "• Consciousness cannot be erased, only changed.",
                        "• Time may never run backwards for any observer.",
                      ].join("\n")}
                    />
                  </FormField>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                    D. Reality Interaction Framework
                  </h3>

                  {/* Reality Rigidity Chips */}
                  <FormField
                    label="Reality Rigidity"
                    htmlFor="cosmos-reality-rigidity"
                    description="Pick how hard or easy it is to bend reality in general. Details go below."
                  >
                    <div className="flex flex-wrap gap-2">
                      {REALITY_RIGIDITY_OPTIONS.map((opt) => {
                        const isActive = cosmos.realityRigidity === opt;
                        const label =
                          opt === "rigid"
                            ? "Rigid"
                            : opt === "balanced"
                            ? "Balanced"
                            : "Fluid";
                        const helper =
                          opt === "rigid"
                            ? "Reality almost never bends."
                            : opt === "balanced"
                            ? "Rare but dramatic bending is possible."
                            : "Reality is highly malleable.";
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              updateCosmos({ realityRigidity: opt as RealityRigidity })
                            }
                            className={`px-3 py-1 rounded-full border text-xs sm:text-sm flex flex-col items-start ${
                              isActive
                                ? "bg-violet-600/80 border-violet-300 text-white"
                                : "bg-black/30 border-white/15 text-zinc-200"
                            }`}
                          >
                            <span className="font-semibold">{label}</span>
                            <span className="text-[10px] sm:text-[11px] text-zinc-300/90">
                              {helper}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </FormField>

                  <FormField
                    label=""
                    htmlFor="cosmos-reality"
                    description="Universal laws defining how beings may interface with or influence reality. Not how to access Source, but what kinds of metaphysical influence are possible."
                  >
                    <textarea
                      id="cosmos-reality"
                      className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      value={cosmos.realityInteractionFramework ?? ""}
                      onChange={(e) =>
                        updateCosmos({
                          realityInteractionFramework: e.target.value,
                        })
                      }
                      placeholder={[
                        "• Can reality be bent, rewritten, or only nudged?",
                        "• Who can do it (anyone with training, only rare beings, etc.)?",
                        "• Hard limits on what no one can ever change.",
                      ].join("\n")}
                    />
                    <ExampleBlock
                      examples={[
                        "Any being can, with enough training, alter local reality slightly; only mythic-tier entities can rewrite large-scale laws, and no one can change the Cosmic Constants.",
                        "Reality is rigid for most, but attuned mystics can create temporary 'soft spots' where probability is skewed. Permanent changes require the collective will of thousands.",
                        "Reality is highly plastic in dream-realms but much stricter in waking planes. Beings may shape form and narrative, but may never alter the underlying harmonic structure.",
                      ]}
                    />
                  </FormField>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                    E. Plane Travel Possibility
                  </h3>
                  <div className="flex flex-col gap-3 p-4 rounded-lg border border-white/10 bg-neutral-950/30">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cosmos.planeTravelPossible ?? false}
                        onChange={(e) =>
                          updateCosmos({ planeTravelPossible: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-white/20 bg-black/30 text-violet-500 focus:ring-violet-500/50"
                      />
                      <span className="text-sm text-zinc-200">
                        Cross-plane travel is possible
                      </span>
                    </label>
                    <p className="text-xs text-zinc-400">
                      If disabled, all plane-level and realm-level travel systems
                      deactivate.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* COSMIC TIME & CYCLES TAB */}
            {activeTab === "time" && (
              <div className="space-y-4">
                {/* Has Cosmic Calendar toggle */}
                <div className="mb-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200">
                  <p className="font-semibold mb-1">Cosmic Calendar</p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cosmos.hasCosmicCalendar ?? true}
                        onChange={(e) =>
                          updateCosmos({ hasCosmicCalendar: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-white/20 bg-black/30 text-violet-500 focus:ring-violet-500/50"
                      />
                      <span className="text-sm text-zinc-200">
                        This cosmos has a distinct cosmic calendar
                      </span>
                    </label>
                    <p className="text-xs text-zinc-400">
                      If unchecked, realms/worlds can define their own local calendars.
                    </p>
                  </div>
                </div>

                {(cosmos.hasCosmicCalendar ?? true) && (
                  <>
                    <FormField
                      label="Cosmic Calendar Name"
                      htmlFor="cosmos-calendar"
                      description="Label for cosmic time."
                    >
                      <Input
                        id="cosmos-calendar"
                        value={cosmos.cosmicCalendarName ?? ""}
                        onChange={(e) =>
                          updateCosmos({ cosmicCalendarName: e.target.value })
                        }
                        placeholder="e.g., The Eternal Cycle, The Grand Epoch..."
                      />
                    </FormField>

                    <FormField
                      label="Cycles / Epochs / Ages"
                      htmlFor="cosmos-cycles"
                      description="Universal ages or repeating cosmic cycles."
                    >
                      <textarea
                        id="cosmos-cycles"
                        className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        value={cosmos.cyclesEpochsAges ?? ""}
                        onChange={(e) =>
                          updateCosmos({ cyclesEpochsAges: e.target.value })
                        }
                        placeholder="List the major epochs, cycles, or ages of the cosmos..."
                      />
                    </FormField>
                  </>
                )}

                {/* Time Flow Type chips */}
                <FormField
                  label="Time Flow Type"
                  htmlFor="cosmos-timeflow-type"
                  description="Pick the main way time behaves. You can explain special cases below."
                >
                  <div className="flex flex-wrap gap-2">
                    {TIME_FLOW_OPTIONS.map((opt) => {
                      const isActive = cosmos.timeFlowType === opt;
                      const label =
                        opt === "linear"
                          ? "Linear"
                          : opt === "cyclical"
                          ? "Cyclical"
                          : opt === "looping"
                          ? "Looping"
                          : opt === "branching"
                          ? "Branching"
                          : opt === "static"
                          ? "Static"
                          : "Beyond-Time";
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            updateCosmos({ timeFlowType: opt as TimeFlowType })
                          }
                          className={`px-3 py-1 rounded-full border text-xs sm:text-sm ${
                            isActive
                              ? "bg-violet-600/80 border-violet-300 text-white"
                              : "bg-black/30 border-white/15 text-zinc-200"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </FormField>

                <FormField
                  label="Time Flow Rules"
                  htmlFor="cosmos-timeflow"
                  description="Explain how time functions in this cosmos, especially any twists or exceptions to the chosen flow type."
                >
                  <textarea
                    id="cosmos-timeflow"
                    className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={cosmos.timeFlowRules ?? ""}
                    onChange={(e) =>
                      updateCosmos({ timeFlowRules: e.target.value })
                    }
                    placeholder="Describe how time functions in this cosmos..."
                  />
                </FormField>

                <FormField
                  label="Major Cosmic Events"
                  htmlFor="cosmos-events"
                  description="Universe-level events such as awakenings, resets, pulses, expansions."
                >
                  <textarea
                    id="cosmos-events"
                    className="w-full min-h-[140px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                    value={cosmos.majorCosmicEvents ?? ""}
                    onChange={(e) =>
                      updateCosmos({ majorCosmicEvents: e.target.value })
                    }
                    placeholder="Major events that affected the entire cosmos..."
                  />
                </FormField>
              </div>
            )}

            {/* PLANES OF EXISTENCE TAB */}
            {activeTab === "planes" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-zinc-100">
                    Planes of Existence
                  </h3>
                  <Button size="sm" variant="primary" onClick={openPlaneModal}>
                    + Add Plane
                  </Button>
                </div>

                {planes.length === 0 ? (
                  <div className="text-center py-12 border border-white/10 rounded-xl bg-black/20">
                    <p className="text-zinc-400 mb-2">No planes defined yet.</p>
                    <p className="text-sm text-zinc-500">
                      Click &quot;Add Plane&quot; to create the first plane of
                      existence in this cosmos.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {planes.map((plane) => (
                      <div
                        key={plane.id}
                        className="rounded-2xl border border-white/10 bg-black/30 p-4 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-zinc-100">
                            {plane.name}
                          </h4>
                          <span className="inline-flex items-center rounded-full border border-violet-300/60 bg-violet-500/20 px-2 py-0.5 text-[11px] uppercase tracking-wide text-violet-100">
                            {plane.type}
                          </span>
                        </div>
                        {plane.description && (
                          <p className="text-xs text-zinc-300/90 line-clamp-3">
                            {plane.description}
                          </p>
                        )}
                        {!plane.description && (
                          <p className="text-xs text-zinc-500 italic">
                            No description yet.
                          </p>
                        )}

                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              // TODO: Replace with router.push to Plane Detail when that exists
                              alert(
                                "Plane details editor coming soon. This will open the Plane form."
                              );
                            }}
                            className="px-3 py-1 rounded-full border border-white/20 bg-black/30 hover:bg-white/10 text-[11px] text-zinc-100 transition"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePlane(plane.id)}
                            className="px-3 py-1 rounded-full border border-red-400/70 bg-red-500/20 hover:bg-red-500/30 text-[11px] text-red-100 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Add Plane Modal */}
      {isPlaneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-neutral-950/95 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-zinc-100">
                New Plane of Existence
              </h2>
              <button
                type="button"
                onClick={() => setIsPlaneModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Give this plane a simple name, pick a type, and a quick description. You
              can flesh out details later in the full Plane Editor.
            </p>

            <div className="space-y-4">
              <FormField label="Plane Name" htmlFor="plane-name">
                <Input
                  id="plane-name"
                  value={planeName}
                  onChange={(e) => setPlaneName(e.target.value)}
                  placeholder="e.g., The Prime Material, The Endless Dream, The Void Between"
                />
              </FormField>

              <FormField
                label="Plane Type"
                htmlFor="plane-type"
                description="Pick a type or choose Custom / Other to name your own."
              >
                <select
                  id="plane-type"
                  className="w-full rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                  value={planeTypeChoice}
                  onChange={(e) =>
                    setPlaneTypeChoice(e.target.value as PlaneTypeOption)
                  }
                >
                  {PLANE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {planeTypeChoice === "Custom / Other" && (
                  <div className="mt-2">
                    <Input
                      value={planeCustomType}
                      onChange={(e) => setPlaneCustomType(e.target.value)}
                      placeholder="Custom plane type (e.g., Narrative, Data-Sea, Memory Field)"
                    />
                  </div>
                )}
              </FormField>

              <FormField
                label="Short Description (optional)"
                htmlFor="plane-description"
                description="1–3 sentences about what this plane is like."
              >
                <textarea
                  id="plane-description"
                  className="w-full min-h-[90px] rounded-lg border border-white/15 bg-neutral-950/80 px-3 py-2 text-sm text-zinc-100"
                  value={planeDescription}
                  onChange={(e) => setPlaneDescription(e.target.value)}
                  placeholder={[
                    "• What is this plane used for or known for?",
                    "• How does it feel to be there?",
                    "• Any obvious signature feature?",
                  ].join("\n")}
                />
              </FormField>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsPlaneModalOpen(false);
                    resetPlaneDraft();
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={addPlane}>
                  Create Plane
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
