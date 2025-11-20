"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { GradientText } from "@/components/GradientText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { Input } from "@/components/Input";
import { Tabs } from "@/components/Tabs";

type UserRole =
  | "admin"
  | "privileged"
  | "world_builder"
  | "world_developer"
  | "universe_creator"
  | "free";

// TODO: replace this with your real auth/role + billing source once wired
const CURRENT_USER_ROLE: UserRole = "admin"; // change for testing other roles
const EXTRA_COSMOS_SLOTS_PURCHASED = 0; // e.g. 1 = one extra slot purchased

/* ---------- Worldbuilder local nav (same as races/inventory/etc) ---------- */

function WBNav({
  current = "cosmos",
}: {
  current?: "cosmos" | "creatures" | "skillsets" | "races" | "inventory" | "npcs";
}) {
  const items = [
    { href: "/worldbuilder/cosmos", key: "cosmos", label: "Cosmos" },
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

/* ---------- Role / limit helpers ---------- */

/**
 * Base world limit per role (before purchased slots).
 * - null = unlimited
 */
function getBaseCosmosLimitForRole(role: UserRole): number | null {
  switch (role) {
    case "admin":
    case "privileged":
      return null; // unlimited
    case "world_builder":
      return 3;
    case "world_developer":
      return 6;
    case "universe_creator":
      return 12;
    case "free":
    default:
      return 0;
  }
}

/**
 * Effective limit including purchased slots.
 * - null = unlimited
 */
function getEffectiveCosmosLimit(
  role: UserRole,
  extraSlots: number
): number | null {
  const base = getBaseCosmosLimitForRole(role);
  if (base === null) return null; // unlimited stays unlimited
  return base + Math.max(0, extraSlots);
}

/* ---------- Types ---------- */

type CosmosStatus = "draft" | "ready" | "published";

type CosmosSummary = {
  id: string;
  slug: string; // for URLs, e.g. "eldarion"
  name: string;
  shortPitch: string;
  status: CosmosStatus;
  createdAt?: string;
  owned: boolean; // user-created
  purchased: boolean; // bought from store/marketplace
  // Detail fields
  description?: string;
  originStory?: string;
  cosmicOperationNotes?: string;
  designerNotes?: string;
  existenceOrigin?: string;
  energyConsciousnessFramework?: string;
  cosmicConstants?: string;
  realityInteractionFramework?: string;
  planeTravelPossible?: boolean;
  cosmicCalendarName?: string;
  cyclesEpochsAges?: string;
  timeFlowRules?: string;
  majorCosmicEvents?: string;
};

// TEMP: mock data for layout. Replace with real data later.
const MOCK_COSMOS: CosmosSummary[] = [
  // {
  //   id: "1",
  //   slug: "eldarion",
  //   name: "Eldarion",
  //   shortPitch: "High-fantasy world of artifacts and kingdom tensions.",
  //   status: "ready",
  //   toneTags: ["high-fantasy", "political"],
  //   genreFamily: ["fantasy"],
  //   createdAt: "2025-11-01T10:00:00Z",
  //   owned: true,
  //   purchased: false,
  // },
];

/* ---------- Helpers ---------- */

function slugifyCosmosName(name: string, existing: CosmosSummary[]): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "cosmos";

  let slug = base;
  let suffix = 1;
  while (existing.some((w) => w.slug === slug)) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

/* ---------- Page ---------- */

export default function CosmosChooserPage() {
  const [cosmos, setCosmos] = useState<CosmosSummary[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Create-cosmos modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCosmosName, setNewCosmosName] = useState("");
  const [newCosmosPitch, setNewCosmosPitch] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // Fetch cosmos on mount
  useEffect(() => {
    async function fetchCosmos() {
      try {
        const response = await fetch('/api/worldbuilder/cosmos');
        if (response.ok) {
          const data = await response.json();
          // Transform DB data to match CosmosSummary type
          const transformed = data.map((c: any) => ({
            ...c,
            owned: true,
            purchased: false,
          }));
          setCosmos(transformed);
        }
      } catch (error) {
        console.error('Failed to fetch cosmos:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCosmos();
  }, []);

  const { ownedCosmos, purchasedCosmos, totalOwnedCount } = useMemo(() => {
    const owned = cosmos.filter((w) => w.owned);
    const purchased = cosmos.filter((w) => w.purchased && !w.owned);
    return {
      ownedCosmos: owned,
      purchasedCosmos: purchased,
      totalOwnedCount: owned.length,
    };
  }, [cosmos]);

  const maxCosmosForRole = getEffectiveCosmosLimit(
    CURRENT_USER_ROLE,
    EXTRA_COSMOS_SLOTS_PURCHASED
  );
  const isUnlimited = maxCosmosForRole === null;

  const hasAnySlots =
    isUnlimited || (maxCosmosForRole !== null && maxCosmosForRole > 0);

  // If truly free and has not purchased any slots, lock the page.
  if (CURRENT_USER_ROLE === "free" && !hasAnySlots) {
    return (
      <main className="min-h-screen px-6 py-10">
        <section className="max-w-3xl mx-auto">
          <Card
            padded={false}
            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl text-center"
          >
            <GradientText
              as="h1"
              variant="title"
              glow
              className="font-evanescent text-3xl sm:text-4xl tracking-tight mb-2"
            >
              Cosmos Builder Locked
            </GradientText>
            <p className="text-sm text-zinc-300/90">
              This account level can&apos;t create or manage cosmos yet. Upgrade
              your role or purchase a cosmos slot to access the Source Forge.
            </p>
          </Card>
        </section>
      </main>
    );
  }

  const remainingSlots = isUnlimited
    ? null
    : Math.max(0, maxCosmosForRole - totalOwnedCount);

  const canCreateCosmos =
    isUnlimited || (remainingSlots !== null && remainingSlots > 0);

  const allCosmos = useMemo(() => {
    const all = [...ownedCosmos, ...purchasedCosmos];
    if (!search.trim()) return all;

    const q = search.toLowerCase();
    return all.filter((w) => {
      return (
        w.name.toLowerCase().includes(q) ||
        w.shortPitch.toLowerCase().includes(q)
      );
    });
  }, [ownedCosmos, purchasedCosmos, search]);

  const isCompletelyEmpty =
    ownedCosmos.length === 0 && purchasedCosmos.length === 0;

  const searchId = "cosmos-search";

  const showPurchaseSlotCta = !isUnlimited; // any capped role can buy more

  function openCreateModal() {
    if (!canCreateCosmos) return;
    setCreateError(null);
    setNewCosmosName("");
    setNewCosmosPitch("");
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false);
    setCreateError(null);
  }

  function handleCreateCosmosSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canCreateCosmos) {
      setCreateError("You have no remaining cosmos slots.");
      return;
    }

    const name = newCosmosName.trim();
    const pitch = newCosmosPitch.trim();

    if (!name) {
      setCreateError("Cosmos name is required.");
      return;
    }
    if (!pitch) {
      setCreateError("Short pitch is required.");
      return;
    }

    const slug = slugifyCosmosName(name, cosmos);

    // Create cosmos via API
    setCreateError(null);
    fetch('/api/worldbuilder/cosmos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, shortPitch: pitch, slug }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to create cosmos');
        }
        return res.json();
      })
      .then((newCosmos) => {
        // Transform to match CosmosSummary
        const transformed = {
          ...newCosmos,
          owned: true,
          purchased: false,
        };
        setCosmos((prev) => [...prev, transformed]);
        closeCreateModal();
      })
      .catch((err) => {
        setCreateError(err.message);
      });
  }

  function handleDeleteCosmos(id: string) {
    const singleCosmos = cosmos.find((w) => w.id === id);
    if (!singleCosmos) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the cosmos "${singleCosmos.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    // Delete via API
    fetch(`/api/worldbuilder/cosmos/${singleCosmos.slug}`, {
      method: 'DELETE',
    })
      .then((res) => {
        if (res.ok) {
          setCosmos((prev) => prev.filter((w) => w.id !== id));
        } else {
          alert('Failed to delete cosmos');
        }
      })
      .catch((err) => {
        console.error('Delete error:', err);
        alert('Failed to delete cosmos');
      });
  }

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
              The Source Forge — Cosmos
            </GradientText>
            <p className="mt-1 text-sm text-zinc-300/90 max-w-2xl">
              This is your cosmos shelf. Each cosmos is a universe root that eras,
              settings, campaigns, and sessions will inherit from.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-3 justify-end">
              <Link href="/worldbuilder">
                <Button variant="secondary" size="sm">
                  ← Source Forge
                </Button>
              </Link>
            </div>

            <Card
              padded={false}
              className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur px-4 py-3 shadow-2xl text-sm text-zinc-200 max-w-xs"
            >
              <div className="flex flex-col gap-1">
                <span className="font-semibold">
                  {isUnlimited
                    ? `${totalOwnedCount} cosmos`
                    : `${totalOwnedCount} / ${maxCosmosForRole} cosmos slots used`}
                </span>
                <span className="text-xs text-zinc-400">
                  {isUnlimited
                    ? "This role can create unlimited cosmos."
                    : remainingSlots && remainingSlots > 0
                    ? `${remainingSlots} open slot${
                        remainingSlots === 1 ? "" : "s"
                      } remaining.`
                    : "Cosmos limit reached. Archive, clear, or purchase a new slot to create more cosmos."}  
                </span>

                {showPurchaseSlotCta && (
                  <Link
                    href="/store/cosmos-slots"
                    className="mt-1 text-xs text-emerald-300 underline hover:text-emerald-200"
                  >
                    Need more room? Purchase another cosmos slot.
                  </Link>
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="flex justify-end">
          <WBNav current="cosmos" />
        </div>
      </header>

      {/* Main content */}
      {isCompletelyEmpty ? (
        <section className="max-w-7xl mx-auto">
          <Card
            padded={false}
            className="max-w-xl mx-auto rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 shadow-2xl text-center"
          >
            <h2 className="text-2xl font-semibold text-zinc-50 mb-2">
              No cosmos yet.
            </h2>
            <p className="mb-6 text-sm text-zinc-300">
              Start by crafting your first cosmos. You can always add Eras,
              Settings, and Campaigns later – but everything begins here.
            </p>

            <Button
              disabled={!canCreateCosmos}
              variant={canCreateCosmos ? "primary" : "ghost"}
              onClick={openCreateModal}
            >
              Create your first cosmos
            </Button>
          </Card>
        </section>
      ) : (
        <section className="max-w-7xl mx-auto flex flex-col gap-6">
          {/* Search */}
          <section className="flex flex-col items-stretch gap-4 md:flex-row md:items-end md:justify-between">
            <div className="w-full max-w-md">
              <FormField label="Search cosmos" htmlFor={searchId}>
                <Input
                  id={searchId}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, pitch, tag, or genre…"
                />
              </FormField>
            </div>
          </section>

          {/* World cards */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {/* Optional: Create card inside grid if we still have slots */}
            {canCreateCosmos && (
              <Card
                padded={false}
                className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 backdrop-blur px-6 py-5 shadow-2xl"
              >
                <div>
                  <h2 className="text-lg font-semibold text-zinc-50">
                    Create a new cosmos
                  </h2>
                  <p className="mt-2 text-sm text-zinc-300">
                    Start fresh with a new universe root. Overview first, then
                    Realms, Sky, and Catalogs.
                  </p>
                </div>
                <div className="mt-4">
                  <Button size="sm" onClick={openCreateModal}>
                    Begin cosmos creation
                  </Button>
                </div>
              </Card>
            )}

            {allCosmos.map((singleCosmos) => (
              <CosmosCard
                key={singleCosmos.id}
                cosmos={singleCosmos}
                onDelete={handleDeleteCosmos}
              />
            ))}
          </section>
        </section>
      )}

      {/* Create World Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <Card
            padded={false}
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950/90 backdrop-blur p-6 shadow-2xl"
          >
            <h2 className="mb-3 text-xl font-semibold text-zinc-50">
              Create New Cosmos
            </h2>
            <p className="mb-4 text-sm text-zinc-300">
              Give your cosmos a name and a short pitch. You can fill in the deep
              details on the next screen.
            </p>

            <form onSubmit={handleCreateCosmosSubmit} className="space-y-4">
              <FormField label="Cosmos Name" htmlFor="new-cosmos-name">
                <Input
                  id="new-cosmos-name"
                  value={newCosmosName}
                  onChange={(e) => setNewCosmosName(e.target.value)}
                  placeholder="e.g. Eldarion, The Fractured Chain"
                />
              </FormField>

              <FormField label="Short Pitch" htmlFor="new-cosmos-pitch">
                <Input
                  id="new-cosmos-pitch"
                  value={newCosmosPitch}
                  onChange={(e) => setNewCosmosPitch(e.target.value)}
                  placeholder="One or two sentences about this cosmos…"
                />
              </FormField>

              {createError && (
                <p className="text-sm text-red-400">{createError}</p>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={closeCreateModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={!canCreateCosmos}
                >
                  Save &amp; Continue
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </main>
  );
}

/* ---------- Cosmos card ---------- */

type CosmosCardProps = {
  cosmos: CosmosSummary;
  onDelete: (id: string) => void;
};

function CosmosCard({ cosmos, onDelete }: CosmosCardProps) {
  const statusLabel = (() => {
    switch (cosmos.status) {
      case "draft":
        return "Draft";
      case "ready":
        return "Ready";
      case "published":
        return "Published";
      default:
        return cosmos.status;
    }
  })();

  return (
    <Card
      padded={false}
      className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur px-6 py-5 shadow-2xl"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">{cosmos.name}</h2>
          {cosmos.shortPitch && (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-300">
              {cosmos.shortPitch}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            cosmos.status === "published"
              ? "bg-emerald-700/30 text-emerald-300"
              : cosmos.status === "ready"
              ? "bg-amber-700/30 text-amber-300"
              : "bg-zinc-700/40 text-zinc-200"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between pt-3 text-xs text-zinc-400">
        <div className="flex flex-col">
          {cosmos.owned && <span>Owned cosmos</span>}
          {cosmos.purchased && !cosmos.owned && <span>Purchased template</span>}
          {cosmos.createdAt && (
            <span>
              Created:{" "}
              {new Date(cosmos.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/worldbuilder/cosmos/${cosmos.slug}`}>
            <Button size="sm" variant="ghost">
              Edit details
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-300 hover:text-red-200"
            onClick={() => onDelete(cosmos.id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
