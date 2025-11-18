"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GradientText } from "@/components/GradientText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { Input } from "@/components/Input";

type UserRole =
  | "admin"
  | "privileged"
  | "world_builder"
  | "world_developer"
  | "universe_creator"
  | "free";

// TODO: replace this with your real auth/role + billing source once wired
const CURRENT_USER_ROLE: UserRole = "admin"; // change for testing other roles
const EXTRA_WORLD_SLOTS_PURCHASED = 0; // e.g. 1 = one extra slot purchased

/* ---------- Worldbuilder local nav (same as races/inventory/etc) ---------- */

function WBNav({
  current = "worlds",
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

/* ---------- Role / limit helpers ---------- */

/**
 * Base world limit per role (before purchased slots).
 * - null = unlimited
 */
function getBaseWorldLimitForRole(role: UserRole): number | null {
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
function getEffectiveWorldLimit(
  role: UserRole,
  extraSlots: number
): number | null {
  const base = getBaseWorldLimitForRole(role);
  if (base === null) return null; // unlimited stays unlimited
  return base + Math.max(0, extraSlots);
}

/* ---------- Types ---------- */

type WorldStatus = "draft" | "ready" | "published";

type WorldSummary = {
  id: string;
  slug: string; // for URLs, e.g. "eldarion"
  name: string;
  shortPitch: string;
  status: WorldStatus;
  toneTags?: string[];
  genreFamily?: string[];
  createdAt?: string;
  owned: boolean; // user-created
  purchased: boolean; // bought from store/marketplace
};

// TEMP: mock data for layout. Replace with real data later.
const MOCK_WORLDS: WorldSummary[] = [
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

function slugifyWorldName(name: string, existing: WorldSummary[]): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "world";

  let slug = base;
  let suffix = 1;
  while (existing.some((w) => w.slug === slug)) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

/* ---------- Page ---------- */

export default function WorldChooserPage() {
  const [worlds, setWorlds] = useState<WorldSummary[]>(MOCK_WORLDS);
  const [search, setSearch] = useState("");

  // Create-world modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWorldName, setNewWorldName] = useState("");
  const [newWorldPitch, setNewWorldPitch] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const { ownedWorlds, purchasedWorlds, totalOwnedCount } = useMemo(() => {
    const owned = worlds.filter((w) => w.owned);
    const purchased = worlds.filter((w) => w.purchased && !w.owned);
    return {
      ownedWorlds: owned,
      purchasedWorlds: purchased,
      totalOwnedCount: owned.length,
    };
  }, [worlds]);

  const maxWorldsForRole = getEffectiveWorldLimit(
    CURRENT_USER_ROLE,
    EXTRA_WORLD_SLOTS_PURCHASED
  );
  const isUnlimited = maxWorldsForRole === null;

  const hasAnySlots =
    isUnlimited || (maxWorldsForRole !== null && maxWorldsForRole > 0);

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
              World Builder Locked
            </GradientText>
            <p className="text-sm text-zinc-300/90">
              This account level can&apos;t create or manage worlds yet. Upgrade
              your role or purchase a world slot to access the Source Forge.
            </p>
          </Card>
        </section>
      </main>
    );
  }

  const remainingSlots = isUnlimited
    ? null
    : Math.max(0, maxWorldsForRole - totalOwnedCount);

  const canCreateWorld =
    isUnlimited || (remainingSlots !== null && remainingSlots > 0);

  const allWorlds = useMemo(() => {
    const all = [...ownedWorlds, ...purchasedWorlds];
    if (!search.trim()) return all;

    const q = search.toLowerCase();
    return all.filter((w) => {
      return (
        w.name.toLowerCase().includes(q) ||
        w.shortPitch.toLowerCase().includes(q) ||
        (w.toneTags || []).some((t) => t.toLowerCase().includes(q)) ||
        (w.genreFamily || []).some((g) => g.toLowerCase().includes(q))
      );
    });
  }, [ownedWorlds, purchasedWorlds, search]);

  const isCompletelyEmpty =
    ownedWorlds.length === 0 && purchasedWorlds.length === 0;

  const searchId = "world-search";

  const showPurchaseSlotCta = !isUnlimited; // any capped role can buy more

  function openCreateModal() {
    if (!canCreateWorld) return;
    setCreateError(null);
    setNewWorldName("");
    setNewWorldPitch("");
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false);
    setCreateError(null);
  }

  function handleCreateWorldSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canCreateWorld) {
      setCreateError("You have no remaining world slots.");
      return;
    }

    const name = newWorldName.trim();
    const pitch = newWorldPitch.trim();

    if (!name) {
      setCreateError("World name is required.");
      return;
    }
    if (!pitch) {
      setCreateError("Short pitch is required.");
      return;
    }

    const slug = slugifyWorldName(name, worlds);
    const now = new Date().toISOString();

    const newWorld: WorldSummary = {
      id: `world_${Date.now()}`,
      slug,
      name,
      shortPitch: pitch,
      status: "draft",
      toneTags: [],
      genreFamily: [],
      createdAt: now,
      owned: true,
      purchased: false,
    };

    setWorlds((prev) => [...prev, newWorld]);
    closeCreateModal();
  }

  function handleDeleteWorld(id: string) {
    const world = worlds.find((w) => w.id === id);
    if (!world) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the world "${world.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setWorlds((prev) => prev.filter((w) => w.id !== id));
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
              The Source Forge — Worlds
            </GradientText>
            <p className="mt-1 text-sm text-zinc-300/90 max-w-2xl">
              This is your world shelf. Each world is a universe root that eras,
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
                    ? `${totalOwnedCount} worlds`
                    : `${totalOwnedCount} / ${maxWorldsForRole} world slots used`}
                </span>
                <span className="text-xs text-zinc-400">
                  {isUnlimited
                    ? "This role can create unlimited worlds."
                    : remainingSlots && remainingSlots > 0
                    ? `${remainingSlots} open slot${
                        remainingSlots === 1 ? "" : "s"
                      } remaining.`
                    : "World limit reached. Archive, clear, or purchase a new slot to create more worlds."}
                </span>

                {showPurchaseSlotCta && (
                  <Link
                    href="/store/world-slots"
                    className="mt-1 text-xs text-emerald-300 underline hover:text-emerald-200"
                  >
                    Need more room? Purchase another world slot.
                  </Link>
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="flex justify-end">
          <WBNav current="worlds" />
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
              No worlds yet.
            </h2>
            <p className="mb-6 text-sm text-zinc-300">
              Start by crafting your first world. You can always add Eras,
              Settings, and Campaigns later – but everything begins here.
            </p>

            <Button
              disabled={!canCreateWorld}
              variant={canCreateWorld ? "primary" : "ghost"}
              onClick={openCreateModal}
            >
              Create your first world
            </Button>
          </Card>
        </section>
      ) : (
        <section className="max-w-7xl mx-auto flex flex-col gap-6">
          {/* Search */}
          <section className="flex flex-col items-stretch gap-4 md:flex-row md:items-end md:justify-between">
            <div className="w-full max-w-md">
              <FormField label="Search worlds" htmlFor={searchId}>
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
            {canCreateWorld && (
              <Card
                padded={false}
                className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 backdrop-blur px-6 py-5 shadow-2xl"
              >
                <div>
                  <h2 className="text-lg font-semibold text-zinc-50">
                    Create a new world
                  </h2>
                  <p className="mt-2 text-sm text-zinc-300">
                    Start fresh with a new universe root. Overview first, then
                    Realms, Sky, and Catalogs.
                  </p>
                </div>
                <div className="mt-4">
                  <Button size="sm" onClick={openCreateModal}>
                    Begin world creation
                  </Button>
                </div>
              </Card>
            )}

            {allWorlds.map((world) => (
              <WorldCard
                key={world.id}
                world={world}
                onDelete={handleDeleteWorld}
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
              Create New World
            </h2>
            <p className="mb-4 text-sm text-zinc-300">
              Give your world a name and a short pitch. You can fill in the deep
              details on the next screen.
            </p>

            <form onSubmit={handleCreateWorldSubmit} className="space-y-4">
              <FormField label="World Name" htmlFor="new-world-name">
                <Input
                  id="new-world-name"
                  value={newWorldName}
                  onChange={(e) => setNewWorldName(e.target.value)}
                  placeholder="e.g. Eldarion, The Fractured Chain"
                />
              </FormField>

              <FormField label="Short Pitch" htmlFor="new-world-pitch">
                <Input
                  id="new-world-pitch"
                  value={newWorldPitch}
                  onChange={(e) => setNewWorldPitch(e.target.value)}
                  placeholder="One or two sentences about this world…"
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
                  disabled={!canCreateWorld}
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

/* ---------- World card ---------- */

type WorldCardProps = {
  world: WorldSummary;
  onDelete: (id: string) => void;
};

function WorldCard({ world, onDelete }: WorldCardProps) {
  const statusLabel = (() => {
    switch (world.status) {
      case "draft":
        return "Draft";
      case "ready":
        return "Ready";
      case "published":
        return "Published";
      default:
        return world.status;
    }
  })();

  return (
    <Card
      padded={false}
      className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur px-6 py-5 shadow-2xl"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">{world.name}</h2>
          {world.shortPitch && (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-300">
              {world.shortPitch}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            world.status === "published"
              ? "bg-emerald-700/30 text-emerald-300"
              : world.status === "ready"
              ? "bg-amber-700/30 text-amber-300"
              : "bg-zinc-700/40 text-zinc-200"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {(world.toneTags?.length || world.genreFamily?.length) && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {world.genreFamily?.map((g) => (
            <span
              key={`genre-${g}`}
              className="rounded-full bg-zinc-900/70 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-300"
            >
              {g}
            </span>
          ))}
          {world.toneTags?.map((t) => (
            <span
              key={`tone-${t}`}
              className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-3 text-xs text-zinc-400">
        <div className="flex flex-col">
          {world.owned && <span>Owned world</span>}
          {world.purchased && !world.owned && <span>Purchased template</span>}
          {world.createdAt && (
            <span>
              Created:{" "}
              {new Date(world.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/worldbuilder/worlds/${world.slug}/overview`}
            className="inline-block"
          >
            <Button size="sm" variant="ghost">
              Edit details
            </Button>
          </Link>
          <Link
            href={`/worldbuilder/worlds/${world.slug}/timeline`}
            className="inline-block"
          >
            <Button size="sm" variant="ghost">
              View world timeline
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-300 hover:text-red-200"
            onClick={() => onDelete(world.id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
