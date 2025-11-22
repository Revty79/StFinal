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
  current = "inventory",
}: {
  current?: "creatures" | "skillsets" | "races" | "inventory" | "npcs";
}) {
  const items = [
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

type InventoryTabKey =
  | "items"
  | "weapons"
  | "armor"
  | "artifacts"
  | "services"
  | "companions"
  | "preview";

type InventoryKind =
  | "items"
  | "weapons"
  | "armor"
  | "artifacts"
  | "services"
  | "companions";

type ShopRole = "loot_only" | "shop_stock" | "exclusive" | null;

export type ItemRow = {
  id: string | number;
  name: string;
  is_free?: boolean;
  shop_ready?: boolean;
  shop_role?: ShopRole;
  createdBy?: string;
  timeline_tag?: string | null;
  cost_credits?: number | null;

  // High-level classification
  item_role?:
    | "mundane"
    | "magic"
    | "artifact"
    | "service"
    | "pet_mount_companion"
    | null;

  category?: string | null;
  subtype?: string | null;
  genre_tags?: string | null;

  mechanical_effect?: string | null;
  weight?: number | null;
  narrative_notes?: string | null;
};

export type WeaponRow = {
  id: string | number;
  name: string;
  is_free?: boolean;
  shop_ready?: boolean;
  shop_role?: ShopRole;
  createdBy?: string;
  timeline_tag?: string | null;
  cost_credits?: number | null;

  category?: string | null;
  handedness?: string | null;

  dtype?: string | null;
  range_type?: string | null;
  range_text?: string | null;

  genre_tags?: string | null;
  weight?: number | null;
  damage?: number | null;
  effect?: string | null;
  narrative_notes?: string | null;
};

export type ArmorRow = {
  id: string | number;
  name: string;
  is_free?: boolean;
  shop_ready?: boolean;
  shop_role?: ShopRole;
  createdBy?: string;
  timeline_tag?: string | null;
  cost_credits?: number | null;

  area_covered?: string | null;
  soak?: number | null;
  category?: string | null;
  atype?: string | null;

  genre_tags?: string | null;
  weight?: number | null;
  encumbrance_penalty?: number | null;
  effect?: string | null;
  narrative_notes?: string | null;
};

export type ArtifactRow = {
  id: string | number;
  name: string;
  is_free?: boolean;
  shop_ready?: boolean;
  shop_role?: ShopRole;
  createdBy?: string;
  timeline_tag?: string | null;
  cost_credits?: number | null;

  category?: string | null; // weapon, armor, wonderous, etc
  rarity?: string | null;
  attunement?: string | null;

  genre_tags?: string | null;
  mechanical_effect?: string | null;
  curse?: string | null;
  origin_lore?: string | null;
  weight?: number | null;
  narrative_notes?: string | null;
};

export type ServiceRow = {
  id: string | number;
  name: string;
  is_free?: boolean;
  shop_ready?: boolean;
  shop_role?: ShopRole;
  createdBy?: string;
  timeline_tag?: string | null;
  cost_credits?: number | null;

  category?: string | null; // travel, lodging, healing, etc
  duration?: string | null;
  genre_tags?: string | null;

  mechanical_effect?: string | null;
  weight?: number | null; // usually null
  narrative_notes?: string | null;
};

export type CompanionRow = {
  id: string | number;
  name: string;
  is_free?: boolean;
  shop_ready?: boolean;
  shop_role?: ShopRole;
  createdBy?: string;
  timeline_tag?: string | null;
  cost_credits?: number | null;

  role?: "pet" | "mount" | "companion" | string | null;
  linked_creature_id?: string | null;
  genre_tags?: string | null;

  mechanical_effect?: string | null;
  care_difficulty?: string | null;
  narrative_notes?: string | null;
};

type AnyRow =
  | ItemRow
  | WeaponRow
  | ArmorRow
  | ArtifactRow
  | ServiceRow
  | CompanionRow;

const INVENTORY_TABS: { id: InventoryTabKey; label: string }[] = [
  { id: "items", label: "Items" },
  { id: "weapons", label: "Weapons" },
  { id: "armor", label: "Armor" },
  { id: "artifacts", label: "Artifacts" },
  { id: "services", label: "Services" },
  { id: "companions", label: "Pets & Companions" },
  { id: "preview", label: "Preview" },
];

const uid = () => Math.random().toString(36).slice(2, 10);
const nv = (x: unknown) =>
  x === null || x === undefined || x === "" ? "—" : String(x);

/* --- field guide when nothing is selected --- */
function InventoryFieldGuide({ activeTab }: { activeTab: InventoryTabKey }) {
  if (activeTab === "preview") {
    return (
      <p className="text-sm text-zinc-400">
        Create or select an entry to see a formatted preview block here.
      </p>
    );
  }

  if (activeTab === "items") {
    return (
      <div className="space-y-3 text-sm text-zinc-300">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Item / Gear template
        </p>
        <ul className="text-xs text-zinc-400 list-disc pl-4 space-y-1">
          <li>Item Role (mundane, magic, artifact, service, pet/mount/companion)</li>
          <li>Timeline Tag &amp; Cost</li>
          <li>Category &amp; Subtype</li>
          <li>Shop-ready flag &amp; shop role</li>
          <li>Genre Tags</li>
          <li>Mechanical Effect</li>
          <li>Weight</li>
          <li>Flavor / Narrative Notes</li>
        </ul>
        <p className="text-[11px] text-zinc-500">
          Use this for general gear, consumables, services, and anything that
          isn&apos;t strictly tracked as a dedicated weapon/armor or artifact
          entry.
        </p>
      </div>
    );
  }

  if (activeTab === "weapons") {
    return (
      <div className="space-y-3 text-sm text-zinc-300">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Weapon template
        </p>
        <ul className="text-xs text-zinc-400 list-disc pl-4 space-y-1">
          <li>Timeline Tag &amp; Cost</li>
          <li>Category &amp; Handedness</li>
          <li>Damage Type &amp; Damage</li>
          <li>Range Type &amp; Range Text</li>
          <li>Shop-ready flag</li>
          <li>Genre Tags</li>
          <li>Weight</li>
          <li>Effect</li>
          <li>Narrative / Flavor Notes</li>
        </ul>
        <p className="text-[11px] text-zinc-500">
          Use this for anything primarily used to attack: melee weapons, ranged,
          guns, spell-foci treated as weapons, etc.
        </p>
      </div>
    );
  }

  if (activeTab === "armor") {
    return (
      <div className="space-y-3 text-sm text-zinc-300">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Armor template
        </p>
        <ul className="text-xs text-zinc-400 list-disc pl-4 space-y-1">
          <li>Timeline Tag &amp; Cost</li>
          <li>Area Covered &amp; Soak</li>
          <li>Category &amp; Armor Type</li>
          <li>Shop-ready flag</li>
          <li>Genre Tags</li>
          <li>Weight &amp; Encumbrance</li>
          <li>Effect</li>
          <li>Narrative / Flavor Notes</li>
        </ul>
        <p className="text-[11px] text-zinc-500">
          Use this for protective gear: armor suits, shields, exoskeletons,
          environmental suits, etc.
        </p>
      </div>
    );
  }

  if (activeTab === "artifacts") {
    return (
      <div className="space-y-3 text-sm text-zinc-300">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Artifact / Relic template
        </p>
        <ul className="text-xs text-zinc-400 list-disc pl-4 space-y-1">
          <li>Timeline Tag &amp; Cost</li>
          <li>Category &amp; Rarity</li>
          <li>Attunement Requirements</li>
          <li>Mechanical Effect</li>
          <li>Curse / Drawbacks</li>
          <li>Origin Lore</li>
          <li>Shop-ready &amp; Role</li>
          <li>Flavor / Narrative Notes</li>
        </ul>
        <p className="text-[11px] text-zinc-500">
          Use this for unique, lore-heavy magic items that matter to the
          setting, eras, and campaigns.
        </p>
      </div>
    );
  }

  if (activeTab === "services") {
    return (
      <div className="space-y-3 text-sm text-zinc-300">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Service template
        </p>
        <ul className="text-xs text-zinc-400 list-disc pl-4 space-y-1">
          <li>Timeline Tag &amp; Cost</li>
          <li>Service Category</li>
          <li>Duration / Scope</li>
          <li>Mechanical Effect (at the table)</li>
          <li>Genre Tags</li>
          <li>Flavor / Narrative Notes</li>
        </ul>
        <p className="text-[11px] text-zinc-500">
          Use this for things you pay for: travel, lodgings, spellcasting,
          crafting commissions, hirelings, and more.
        </p>
      </div>
    );
  }

  // companions
  return (
    <div className="space-y-3 text-sm text-zinc-300">
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        Pets / Mounts / Companions
      </p>
      <ul className="text-xs text-zinc-400 list-disc pl-4 space-y-1">
        <li>Timeline Tag &amp; Cost</li>
        <li>Role (pet, mount, companion)</li>
        <li>Linked Creature (from Creatures DB, later)</li>
        <li>Mechanical Effect</li>
        <li>Care / Logistics Notes</li>
        <li>Flavor / Narrative Notes</li>
      </ul>
      <p className="text-[11px] text-zinc-500">
        Use this for buying or unlocking living allies that come with stats and
        story weight, not just gear.
      </p>
    </div>
  );
}

/* ---------- main page ---------- */

export default function InventoryPage() {
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

  // inventory data
  const [items, setItems] = useState<ItemRow[]>([]);
  const [weapons, setWeapons] = useState<WeaponRow[]>([]);
  const [armor, setArmor] = useState<ArmorRow[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [companions, setCompanions] = useState<CompanionRow[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<InventoryTabKey>("items");
  const [kind, setKind] = useState<InventoryKind>("items"); // last non-preview kind
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qtext, setQtext] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: string;
  } | null>(null);

  // Load inventory from database on mount
  useEffect(() => {
    async function loadInventory() {
      try {
        // Load current user
        const userResponse = await fetch("/api/profile/me");
        const userData = await userResponse.json();
        if (userData.ok && userData.user) {
          setCurrentUser({ id: userData.user.id, role: userData.user.role });
        }

        const [
          itemsRes,
          weaponsRes,
          armorRes,
          artifactsRes,
          servicesRes,
          companionsRes,
        ] = await Promise.all([
          fetch("/api/worldbuilder/inventory/items"),
          fetch("/api/worldbuilder/inventory/weapons"),
          fetch("/api/worldbuilder/inventory/armor"),
          fetch("/api/worldbuilder/inventory/artifacts"),
          fetch("/api/worldbuilder/inventory/services"),
          fetch("/api/worldbuilder/inventory/companions"),
        ]);

        const [
          itemsData,
          weaponsData,
          armorData,
          artifactsData,
          servicesData,
          companionsData,
        ] = await Promise.all([
          itemsRes.json(),
          weaponsRes.json(),
          armorRes.json(),
          artifactsRes.json(),
          servicesRes.json(),
          companionsRes.json(),
        ]);

        if (
          !itemsData.ok ||
          !weaponsData.ok ||
          !armorData.ok ||
          !artifactsData.ok ||
          !servicesData.ok ||
          !companionsData.ok
        ) {
          throw new Error("Failed to load inventory");
        }

        setItems(
          (itemsData.items || []).map((i: any) => ({
            ...i,
            is_free: i.isFree,
            shop_ready: i.shopReady,
            shop_role: i.shopRole ?? null,
          }))
        );
        setWeapons(
          (weaponsData.weapons || []).map((w: any) => ({
            ...w,
            is_free: w.isFree,
            shop_ready: w.shopReady,
            shop_role: w.shopRole ?? null,
          }))
        );
        setArmor(
          (armorData.armor || []).map((a: any) => ({
            ...a,
            is_free: a.isFree,
            shop_ready: a.shopReady,
            shop_role: a.shopRole ?? null,
          }))
        );
        setArtifacts(
          (artifactsData.artifacts || []).map((a: any) => ({
            ...a,
            is_free: a.isFree,
            shop_ready: a.shopReady,
            shop_role: a.shopRole ?? null,
          }))
        );
        setServices(
          (servicesData.services || []).map((s: any) => ({
            ...s,
            is_free: s.isFree,
            shop_ready: s.shopReady,
            shop_role: s.shopRole ?? null,
          }))
        );
        setCompanions(
          (companionsData.companions || []).map((c: any) => ({
            ...c,
            is_free: c.isFree,
            shop_ready: c.shopReady,
            shop_role: c.shopRole ?? null,
          }))
        );
      } catch (error) {
        console.error("Error loading inventory:", error);
        alert(
          `Failed to load inventory: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    }

    loadInventory();
  }, []);

  const currentKind: InventoryKind = kind;

  const currentList: AnyRow[] = useMemo(() => {
    switch (currentKind) {
      case "items":
        return items;
      case "weapons":
        return weapons;
      case "armor":
        return armor;
      case "artifacts":
        return artifacts;
      case "services":
        return services;
      case "companions":
        return companions;
      default:
        return items;
    }
  }, [currentKind, items, weapons, armor, artifacts, services, companions]);

  const selected: AnyRow | null = useMemo(
    () =>
      currentList.find((r) => String(r.id) === String(selectedId ?? "")) ??
      null,
    [currentList, selectedId]
  );

  // ensure something is selected when switching kinds
  useEffect(() => {
    if (!currentList.length) {
      setSelectedId(null);
      return;
    }
    if (!selected) {
      const first = currentList[0];
      if (first) {
        setSelectedId(String(first.id));
      }
    }
  }, [currentList, selected]);

  const filteredList = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter((r) => {
      const base = [
        r.name,
        "category" in r ? ((r as any).category ?? "") : "",
        "genre_tags" in r ? ((r as any).genre_tags ?? "") : "",
      ]
        .join(" ")
        .toLowerCase();
      return base.includes(q);
    });
  }, [currentList, qtext]);

  /* ---------- CRUD helpers (UI-only) ---------- */

  function createRecord() {
    const id = uid();
    let nowName = "New Entry";
    if (currentKind === "items") nowName = "New Item";
    else if (currentKind === "weapons") nowName = "New Weapon";
    else if (currentKind === "armor") nowName = "New Armor";
    else if (currentKind === "artifacts") nowName = "New Artifact";
    else if (currentKind === "services") nowName = "New Service";
    else if (currentKind === "companions") nowName = "New Companion";

    if (currentKind === "items") {
      const row: ItemRow = {
        id,
        name: nowName,
        is_free: true,
        shop_ready: true,
        shop_role: "shop_stock",
        timeline_tag: null,
        cost_credits: null,
        item_role: "mundane",
        category: null,
        subtype: null,
        genre_tags: null,
        mechanical_effect: null,
        weight: null,
        narrative_notes: null,
      };
      setItems((prev) => [row, ...prev]);
    } else if (currentKind === "weapons") {
      const row: WeaponRow = {
        id,
        name: nowName,
        is_free: true,
        shop_ready: true,
        shop_role: "shop_stock",
        timeline_tag: null,
        cost_credits: null,
        category: null,
        handedness: null,
        dtype: null,
        range_type: null,
        range_text: null,
        genre_tags: null,
        weight: null,
        damage: null,
        effect: null,
        narrative_notes: null,
      };
      setWeapons((prev) => [row, ...prev]);
    } else if (currentKind === "armor") {
      const row: ArmorRow = {
        id,
        name: nowName,
        is_free: true,
        shop_ready: true,
        shop_role: "shop_stock",
        timeline_tag: null,
        cost_credits: null,
        area_covered: null,
        soak: null,
        category: null,
        atype: null,
        genre_tags: null,
        weight: null,
        encumbrance_penalty: null,
        effect: null,
        narrative_notes: null,
      };
      setArmor((prev) => [row, ...prev]);
    } else if (currentKind === "artifacts") {
      const row: ArtifactRow = {
        id,
        name: nowName,
        is_free: true,
        shop_ready: false,
        shop_role: "exclusive",
        timeline_tag: null,
        cost_credits: null,
        category: null,
        rarity: null,
        attunement: null,
        genre_tags: null,
        mechanical_effect: null,
        curse: null,
        origin_lore: null,
        weight: null,
        narrative_notes: null,
      };
      setArtifacts((prev) => [row, ...prev]);
    } else if (currentKind === "services") {
      const row: ServiceRow = {
        id,
        name: nowName,
        is_free: true,
        shop_ready: true,
        shop_role: "shop_stock",
        timeline_tag: null,
        cost_credits: null,
        category: null,
        duration: null,
        genre_tags: null,
        mechanical_effect: null,
        weight: null,
        narrative_notes: null,
      };
      setServices((prev) => [row, ...prev]);
    } else {
      const row: CompanionRow = {
        id,
        name: nowName,
        is_free: true,
        shop_ready: true,
        shop_role: "shop_stock",
        timeline_tag: null,
        cost_credits: null,
        role: "mount",
        linked_creature_id: null,
        genre_tags: null,
        mechanical_effect: null,
        care_difficulty: null,
        narrative_notes: null,
      };
      setCompanions((prev) => [row, ...prev]);
    }

    setSelectedId(id);
    if (activeTab === "preview") {
      setActiveTab(currentKind);
    }
  }

  async function deleteSelected() {
    if (!selected || !currentUser) return;
    const idStr = String(selected.id);

    const isNew = typeof selected.id === "string" && selected.id.length < 20;
    const isAdmin = currentUser.role?.toLowerCase() === "admin";
    const isCreator = (selected as any).createdBy === currentUser.id;

    if (!isNew && !isAdmin && !isCreator) {
      alert("You can only delete records you created. Admins can delete any record.");
      return;
    }

    if (!confirm("Delete this record from the inventory?")) return;

    const removeFromState = () => {
      if (currentKind === "items") {
        setItems((prev) => prev.filter((r) => String(r.id) !== idStr));
      } else if (currentKind === "weapons") {
        setWeapons((prev) => prev.filter((r) => String(r.id) !== idStr));
      } else if (currentKind === "armor") {
        setArmor((prev) => prev.filter((r) => String(r.id) !== idStr));
      } else if (currentKind === "artifacts") {
        setArtifacts((prev) => prev.filter((r) => String(r.id) !== idStr));
      } else if (currentKind === "services") {
        setServices((prev) => prev.filter((r) => String(r.id) !== idStr));
      } else {
        setCompanions((prev) => prev.filter((r) => String(r.id) !== idStr));
      }
    };

    if (isNew) {
      removeFromState();
      setSelectedId(null);
      return;
    }

    try {
      const response = await fetch(
        `/api/worldbuilder/inventory/${currentKind}/${selected.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to delete record");
      }

      removeFromState();
      setSelectedId(null);
      alert("Record deleted successfully!");
    } catch (error) {
      console.error("Error deleting record:", error);
      alert(
        `Failed to delete record: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  function renameSelected(newName: string) {
    if (!selected) return;
    const idStr = String(selected.id);

    if (currentKind === "items") {
      setItems((prev) =>
        prev.map((r) =>
          String(r.id) === idStr ? ({ ...r, name: newName } as ItemRow) : r
        )
      );
    } else if (currentKind === "weapons") {
      setWeapons((prev) =>
        prev.map((r) =>
          String(r.id) === idStr ? ({ ...r, name: newName } as WeaponRow) : r
        )
      );
    } else if (currentKind === "armor") {
      setArmor((prev) =>
        prev.map((r) =>
          String(r.id) === idStr ? ({ ...r, name: newName } as ArmorRow) : r
        )
      );
    } else if (currentKind === "artifacts") {
      setArtifacts((prev) =>
        prev.map((r) =>
          String(r.id) === idStr ? ({ ...r, name: newName } as ArtifactRow) : r
        )
      );
    } else if (currentKind === "services") {
      setServices((prev) =>
        prev.map((r) =>
          String(r.id) === idStr ? ({ ...r, name: newName } as ServiceRow) : r
        )
      );
    } else {
      setCompanions((prev) =>
        prev.map((r) =>
          String(r.id) === idStr
            ? ({ ...r, name: newName } as CompanionRow)
            : r
        )
      );
    }
  }

  function updateSelected(
    patch:
      | Partial<ItemRow>
      | Partial<WeaponRow>
      | Partial<ArmorRow>
      | Partial<ArtifactRow>
      | Partial<ServiceRow>
      | Partial<CompanionRow>
  ) {
    if (!selected) return;
    const idStr = String(selected.id);

    if (currentKind === "items") {
      setItems((prev) =>
        prev.map((r) =>
          String(r.id) === idStr ? ({ ...r, ...patch } as ItemRow) : r
        )
      );
    } else if (currentKind === "weapons") {
      setWeapons((prev) =>
        prev.map((r) =>
          String(r.id) === idStr ? ({ ...r, ...patch } as WeaponRow) : r
        )
      );
    } else if (currentKind === "armor") {
      setArmor((prev) =>
        prev.map((r) =>
          String(r.id) === idStr ? ({ ...r, ...patch } as ArmorRow) : r
        )
      );
    } else if (currentKind === "artifacts") {
      setArtifacts((prev) =>
        prev.map((r) =>
          String(r.id) === idStr ? ({ ...r, ...patch } as ArtifactRow) : r
        )
      );
    } else if (currentKind === "services") {
      setServices((prev) =>
        prev.map((r) =>
          String(r.id) === idStr ? ({ ...r, ...patch } as ServiceRow) : r
        )
      );
    } else {
      setCompanions((prev) =>
        prev.map((r) =>
          String(r.id) === idStr ? ({ ...r, ...patch } as CompanionRow) : r
        )
      );
    }
  }

  async function saveSelected() {
    if (!selected) return;

    try {
      let payload: any = {
        name: selected.name,
        isFree: selected.is_free ?? true,
        shopReady: (selected as any).shop_ready ?? true,
        shopRole: (selected as any).shop_role ?? null,
      };

      if (currentKind === "items") {
        const item = selected as ItemRow;
        payload = {
          ...payload,
          timelineTag: item.timeline_tag,
          costCredits: item.cost_credits,
          itemRole: item.item_role,
          category: item.category,
          subtype: item.subtype,
          genreTags: item.genre_tags,
          mechanicalEffect: item.mechanical_effect,
          weight: item.weight,
          narrativeNotes: item.narrative_notes,
        };
      } else if (currentKind === "weapons") {
        const weapon = selected as WeaponRow;
        payload = {
          ...payload,
          timelineTag: weapon.timeline_tag,
          costCredits: weapon.cost_credits,
          category: weapon.category,
          handedness: weapon.handedness,
          dtype: weapon.dtype,
          rangeType: weapon.range_type,
          rangeText: weapon.range_text,
          genreTags: weapon.genre_tags,
          weight: weapon.weight,
          damage: weapon.damage,
          effect: weapon.effect,
          narrativeNotes: weapon.narrative_notes,
        };
      } else if (currentKind === "armor") {
        const armorItem = selected as ArmorRow;
        payload = {
          ...payload,
          timelineTag: armorItem.timeline_tag,
          costCredits: armorItem.cost_credits,
          areaCovered: armorItem.area_covered,
          soak: armorItem.soak,
          category: armorItem.category,
          atype: armorItem.atype,
          genreTags: armorItem.genre_tags,
          weight: armorItem.weight,
          encumbrancePenalty: armorItem.encumbrance_penalty,
          effect: armorItem.effect,
          narrativeNotes: armorItem.narrative_notes,
        };
      } else if (currentKind === "artifacts") {
        const artifact = selected as ArtifactRow;
        payload = {
          ...payload,
          timelineTag: artifact.timeline_tag,
          costCredits: artifact.cost_credits,
          category: artifact.category,
          rarity: artifact.rarity,
          attunement: artifact.attunement,
          genreTags: artifact.genre_tags,
          mechanicalEffect: artifact.mechanical_effect,
          curse: artifact.curse,
          originLore: artifact.origin_lore,
          weight: artifact.weight,
          narrativeNotes: artifact.narrative_notes,
        };
      } else if (currentKind === "services") {
        const service = selected as ServiceRow;
        payload = {
          ...payload,
          timelineTag: service.timeline_tag,
          costCredits: service.cost_credits,
          category: service.category,
          duration: service.duration,
          genreTags: service.genre_tags,
          mechanicalEffect: service.mechanical_effect,
          weight: service.weight,
          narrativeNotes: service.narrative_notes,
        };
      } else {
        const companion = selected as CompanionRow;
        payload = {
          ...payload,
          timelineTag: companion.timeline_tag,
          costCredits: companion.cost_credits,
          role: companion.role,
          linkedCreatureId: companion.linked_creature_id,
          genreTags: companion.genre_tags,
          mechanicalEffect: companion.mechanical_effect,
          careDifficulty: companion.care_difficulty,
          narrativeNotes: companion.narrative_notes,
        };
      }

      const isNew = typeof selected.id === "string" && selected.id.length < 20;

      let response;
      if (isNew) {
        response = await fetch(`/api/worldbuilder/inventory/${currentKind}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(
          `/api/worldbuilder/inventory/${currentKind}/${selected.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to save record");
      }

      if (isNew) {
        const oldId = selected.id;
        const savedRecord =
          data.item ||
          data.weapon ||
          data.armor ||
          data.artifact ||
          data.service ||
          data.companion;

        if (savedRecord) {
          const transformed: AnyRow = {
            ...savedRecord,
            is_free: savedRecord.isFree,
            shop_ready: savedRecord.shopReady,
            shop_role: savedRecord.shopRole ?? null,
          };

          if (currentKind === "items") {
            setItems((prev) =>
              prev.map((r) =>
                String(r.id) === String(oldId) ? (transformed as ItemRow) : r
              )
            );
          } else if (currentKind === "weapons") {
            setWeapons((prev) =>
              prev.map((r) =>
                String(r.id) === String(oldId) ? (transformed as WeaponRow) : r
              )
            );
          } else if (currentKind === "armor") {
            setArmor((prev) =>
              prev.map((r) =>
                String(r.id) === String(oldId) ? (transformed as ArmorRow) : r
              )
            );
          } else if (currentKind === "artifacts") {
            setArtifacts((prev) =>
              prev.map((r) =>
                String(r.id) === String(oldId)
                  ? (transformed as ArtifactRow)
                  : r
              )
            );
          } else if (currentKind === "services") {
            setServices((prev) =>
              prev.map((r) =>
                String(r.id) === String(oldId)
                  ? (transformed as ServiceRow)
                  : r
              )
            );
          } else {
            setCompanions((prev) =>
              prev.map((r) =>
                String(r.id) === String(oldId)
                  ? (transformed as CompanionRow)
                  : r
              )
            );
          }

          setSelectedId(savedRecord.id);
        }
      }

      alert("Record saved successfully!");
    } catch (error) {
      console.error("Error saving record:", error);
      alert(
        `Failed to save record: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /* ---------- preview text ---------- */

  const previewText = useMemo(() => {
    if (!selected) return "";

    if (currentKind === "items") {
      const i = selected as ItemRow;
      return [
        `Item: ${i.name}`,
        `Role: ${nv(i.item_role)}   Shop: ${nv(
          (i.shop_ready ?? true) ? i.shop_role ?? "shop_stock" : "loot_only"
        )}`,
        `Timeline: ${nv(i.timeline_tag)}   Cost: ${nv(i.cost_credits)}`,
        `Category/Subtype: ${nv(i.category)} / ${nv(i.subtype)}`,
        `Tags: ${nv(i.genre_tags)}`,
        `Effect: ${nv(i.mechanical_effect)}`,
        `Weight: ${nv(i.weight)}`,
        `Notes: ${nv(i.narrative_notes)}`,
      ].join("\n");
    } else if (currentKind === "weapons") {
      const w = selected as WeaponRow;
      return [
        `Weapon: ${w.name}`,
        `Shop: ${nv(
          (w.shop_ready ?? true) ? w.shop_role ?? "shop_stock" : "loot_only"
        )}`,
        `Timeline: ${nv(w.timeline_tag)}   Cost: ${nv(w.cost_credits)}`,
        `Category: ${nv(w.category)}   Handedness: ${nv(w.handedness)}`,
        `Damage Type: ${nv(w.dtype)}   Damage: ${nv(w.damage)}`,
        `Range Type: ${nv(w.range_type)}   Range: ${nv(w.range_text)}`,
        `Tags: ${nv(w.genre_tags)}`,
        `Weight: ${nv(w.weight)}`,
        `Effect: ${nv(w.effect)}`,
        `Notes: ${nv(w.narrative_notes)}`,
      ].join("\n");
    } else if (currentKind === "armor") {
      const a = selected as ArmorRow;
      return [
        `Armor: ${a.name}`,
        `Shop: ${nv(
          (a.shop_ready ?? true) ? a.shop_role ?? "shop_stock" : "loot_only"
        )}`,
        `Timeline: ${nv(a.timeline_tag)}   Cost: ${nv(a.cost_credits)}`,
        `Area Covered: ${nv(a.area_covered)}   Soak: ${nv(a.soak)}`,
        `Category: ${nv(a.category)}   Type: ${nv(a.atype)}`,
        `Tags: ${nv(a.genre_tags)}`,
        `Weight: ${nv(a.weight)}   Encumbrance: ${nv(
          a.encumbrance_penalty
        )}`,
        `Effect: ${nv(a.effect)}`,
        `Notes: ${nv(a.narrative_notes)}`,
      ].join("\n");
    } else if (currentKind === "artifacts") {
      const art = selected as ArtifactRow;
      return [
        `Artifact: ${art.name}`,
        `Rarity: ${nv(art.rarity)}   Category: ${nv(art.category)}`,
        `Attunement: ${nv(art.attunement)}`,
        `Shop: ${nv(
          (art.shop_ready ?? false)
            ? art.shop_role ?? "exclusive"
            : "story_only"
        )}`,
        `Timeline: ${nv(art.timeline_tag)}   Cost: ${nv(art.cost_credits)}`,
        `Tags: ${nv(art.genre_tags)}`,
        `Effect: ${nv(art.mechanical_effect)}`,
        `Curse: ${nv(art.curse)}`,
        `Origin: ${nv(art.origin_lore)}`,
        `Weight: ${nv(art.weight)}`,
        `Notes: ${nv(art.narrative_notes)}`,
      ].join("\n");
    } else if (currentKind === "services") {
      const s = selected as ServiceRow;
      return [
        `Service: ${s.name}`,
        `Category: ${nv(s.category)}   Duration: ${nv(s.duration)}`,
        `Shop: ${nv(
          (s.shop_ready ?? true) ? s.shop_role ?? "shop_stock" : "loot_only"
        )}`,
        `Timeline: ${nv(s.timeline_tag)}   Cost: ${nv(s.cost_credits)}`,
        `Tags: ${nv(s.genre_tags)}`,
        `Effect: ${nv(s.mechanical_effect)}`,
        `Notes: ${nv(s.narrative_notes)}`,
      ].join("\n");
    } else {
      const c = selected as CompanionRow;
      return [
        `Companion: ${c.name}`,
        `Role: ${nv(c.role)}   Linked Creature: ${nv(c.linked_creature_id)}`,
        `Timeline: ${nv(c.timeline_tag)}   Cost: ${nv(c.cost_credits)}`,
        `Shop: ${nv(
          (c.shop_ready ?? true) ? c.shop_role ?? "shop_stock" : "loot_only"
        )}`,
        `Tags: ${nv(c.genre_tags)}`,
        `Effect: ${nv(c.mechanical_effect)}`,
        `Care / Logistics: ${nv(c.care_difficulty)}`,
        `Notes: ${nv(c.narrative_notes)}`,
      ].join("\n");
    }
  }, [selected, currentKind]);

  const kindLabel =
    currentKind === "items"
      ? "Item"
      : currentKind === "weapons"
      ? "Weapon"
      : currentKind === "armor"
      ? "Armor"
      : currentKind === "artifacts"
      ? "Artifact"
      : currentKind === "services"
      ? "Service"
      : "Companion";

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
              The Source Forge — Inventory
            </GradientText>
            <p className="mt-1 text-sm text-zinc-300/90 max-w-2xl">
              Build items, weapons, armor, artifacts, services, and living
              companions that your worlds, eras, and campaigns can adopt. One
              builder, shop-ready out of the box.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Link href="/worldbuilder">
              <Button variant="secondary" size="sm" type="button">
                ← Source Forge
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex justify-end">
          <WBNav current="inventory" />
        </div>
      </header>

      {/* Quick help */}
      <section className="max-w-7xl mx-auto mb-4">
        <Card className="bg-white/5 border border-white/10 rounded-3xl p-4 shadow-lg">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-zinc-200">How this page works</h2>
            <p className="text-xs text-zinc-400">
              This quick-start is already baked into your repo so teammates can
              see the latest Inventory workflow at a glance.
            </p>
            <ol className="list-decimal pl-5 text-sm text-zinc-300 space-y-1">
              <li>
                Choose a tab (Items, Weapons, Armor, Artifacts, Services, or Pets &amp;
                Companions) to filter the library and the form fields for that type.
              </li>
              <li>
                Use <span className="font-medium text-zinc-100">Search</span> to find an
                entry, then click a row to load it into the editor. Use
                <span className="font-medium text-zinc-100"> + New {kindLabel}</span> to
                start from scratch.
              </li>
              <li>
                Fill in the form on the right; the Preview tab shows the formatted block
                to copy into your docs or shops.
              </li>
            </ol>
          </div>
        </Card>
      </section>

      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
        {/* LEFT: library */}
        <Card
          padded={false}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-200">
              Inventory Library
            </h2>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={createRecord}
            >
              + New {kindLabel}
            </Button>
          </div>

          {/* Filter */}
          <div className="space-y-2">
            <Input
              value={qtext}
              onChange={(e) => setQtext(e.target.value)}
              placeholder={`Search ${kindLabel.toLowerCase()}s by name/tags…`}
            />
          </div>

          {/* List */}
          <div className="mt-2 flex-1 min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 border-b border-white/10">
              <span>
                {kindLabel}s: {filteredList.length}
              </span>
              <span className="uppercase tracking-wide text-[10px] text-zinc-500">
                {kindLabel} records
              </span>
            </div>

            <div className="max-h-[420px] overflow-auto">
              {filteredList.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">
                  No {kindLabel.toLowerCase()}s yet. Create your first one.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-left text-zinc-400">
                    <tr>
                      <th className="px-3 py-1">Name</th>
                      {currentKind === "items" && (
                        <>
                          <th className="px-3 py-1">Role</th>
                          <th className="px-3 py-1">Cost</th>
                        </>
                      )}
                      {currentKind === "weapons" && (
                        <>
                          <th className="px-3 py-1">Category</th>
                          <th className="px-3 py-1">Damage</th>
                        </>
                      )}
                      {currentKind === "armor" && (
                        <>
                          <th className="px-3 py-1">Area</th>
                          <th className="px-3 py-1">Soak</th>
                        </>
                      )}
                      {currentKind === "artifacts" && (
                        <>
                          <th className="px-3 py-1">Rarity</th>
                          <th className="px-3 py-1">Cost</th>
                        </>
                      )}
                      {currentKind === "services" && (
                        <>
                          <th className="px-3 py-1">Category</th>
                          <th className="px-3 py-1">Cost</th>
                        </>
                      )}
                      {currentKind === "companions" && (
                        <>
                          <th className="px-3 py-1">Role</th>
                          <th className="px-3 py-1">Cost</th>
                        </>
                      )}
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

                          {currentKind === "items" && (
                            <>
                              <td className="px-3 py-1.5">
                                {nv((r as ItemRow).item_role)}
                              </td>
                              <td className="px-3 py-1.5">
                                {nv((r as ItemRow).cost_credits)}
                              </td>
                            </>
                          )}
                          {currentKind === "weapons" && (
                            <>
                              <td className="px-3 py-1.5">
                                {nv((r as WeaponRow).category)}
                              </td>
                              <td className="px-3 py-1.5">
                                {nv((r as WeaponRow).damage)}
                              </td>
                            </>
                          )}
                          {currentKind === "armor" && (
                            <>
                              <td className="px-3 py-1.5">
                                {nv((r as ArmorRow).area_covered)}
                              </td>
                              <td className="px-3 py-1.5">
                                {nv((r as ArmorRow).soak)}
                              </td>
                            </>
                          )}
                          {currentKind === "artifacts" && (
                            <>
                              <td className="px-3 py-1.5">
                                {nv((r as ArtifactRow).rarity)}
                              </td>
                              <td className="px-3 py-1.5">
                                {nv((r as ArtifactRow).cost_credits)}
                              </td>
                            </>
                          )}
                          {currentKind === "services" && (
                            <>
                              <td className="px-3 py-1.5">
                                {nv((r as ServiceRow).category)}
                              </td>
                              <td className="px-3 py-1.5">
                                {nv((r as ServiceRow).cost_credits)}
                              </td>
                            </>
                          )}
                          {currentKind === "companions" && (
                            <>
                              <td className="px-3 py-1.5">
                                {nv((r as CompanionRow).role)}
                              </td>
                              <td className="px-3 py-1.5">
                                {nv((r as CompanionRow).cost_credits)}
                              </td>
                            </>
                          )}
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
                    (selected as any).createdBy !== currentUser.id)
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
            <p className="text-sm text-zinc-400">Loading inventory...</p>
          ) : (
            <>
              {/* header + tabs always visible */}
              <div className="mb-4 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1">
                  <Input
                    value={selected?.name ?? ""}
                    disabled={!selected}
                    onChange={(e) => updateSelected({ name: e.target.value })}
                    placeholder={`${kindLabel} name (e.g., Lantern, Longsword, Chainmail, Ghost Ship...)`}
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">
                    This is the label your players and other tools will see
                    everywhere.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!selected}
                        checked={selected?.is_free ?? true}
                        onChange={(e) =>
                          updateSelected({ is_free: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-white/20 bg-black/30 text-violet-500 focus:ring-violet-500/50"
                      />
                      <span className="text-sm text-zinc-300">
                        Free (available to all users)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!selected}
                        checked={(selected as any)?.shop_ready ?? true}
                        onChange={(e) =>
                          updateSelected({ shop_ready: e.target.checked } as any)
                        }
                        className="w-4 h-4 rounded border-white/20 bg-black/30 text-violet-500 focus:ring-violet-500/50"
                      />
                      <span className="text-sm text-zinc-300">
                        Shop-ready (show up in default shops)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  <Tabs
                    tabs={INVENTORY_TABS}
                    activeId={activeTab}
                    onChange={(id) => {
                      const tabId = id as InventoryTabKey;
                      setActiveTab(tabId);
                      if (tabId !== "preview") {
                        setKind(tabId as InventoryKind);
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      type="button"
                      onClick={saveSelected}
                      disabled={!selected}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {!selected ? (
                  <InventoryFieldGuide activeTab={activeTab} />
                ) : (
                  <>
                    {/* ITEMS */}
                    {selected &&
                      activeTab === "items" &&
                      currentKind === "items" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField label="Item Role" htmlFor="item-role">
                              <select
                                id="item-role"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                                value={(selected as ItemRow).item_role ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    item_role:
                                      (e.target.value as ItemRow["item_role"]) ||
                                      null,
                                  })
                                }
                              >
                                <option value="">(unspecified)</option>
                                <option value="mundane">Mundane Gear</option>
                                <option value="magic">Magic Item</option>
                                <option value="artifact">Artifact / Relic</option>
                                <option value="service">Service</option>
                                <option value="pet_mount_companion">
                                  Pet / Mount / Companion
                                </option>
                              </select>
                            </FormField>

                            <FormField
                              label="Shop Role"
                              htmlFor="item-shop-role"
                              description="Loot only, normal stock, or special / exclusive."
                            >
                              <select
                                id="item-shop-role"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                                value={(selected as ItemRow).shop_role ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    shop_role:
                                      (e.target.value as ShopRole) || null,
                                  } as any)
                                }
                              >
                                <option value="">(auto)</option>
                                <option value="loot_only">Loot Only</option>
                                <option value="shop_stock">Shop Stock</option>
                                <option value="exclusive">Exclusive</option>
                              </select>
                            </FormField>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              label="Timeline Tag"
                              htmlFor="item-timeline"
                            >
                              <Input
                                id="item-timeline"
                                value={(selected as ItemRow).timeline_tag ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    timeline_tag: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                            <FormField
                              label="Cost (Credits)"
                              htmlFor="item-cost"
                            >
                              <Input
                                id="item-cost"
                                type="number"
                                value={
                                  (selected as ItemRow).cost_credits ?? ""
                                }
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
                            <FormField
                              label="Category"
                              htmlFor="item-category"
                              description="High-level grouping for filters and shops."
                            >
                              <select
                                id="item-category"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                                value={(selected as ItemRow).category ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    category: e.target.value,
                                  })
                                }
                              >
                                <option value="">(free text)</option>
                                <option value="gear">General Gear</option>
                                <option value="tool">Tool / Kit</option>
                                <option value="consumable">Consumable</option>
                                <option value="focus">Spell Focus</option>
                                <option value="ammo">Ammunition</option>
                                <option value="service_contract">
                                  Service Contract
                                </option>
                                <option value="pet_mount_item">
                                  Pet / Mount Gear
                                </option>
                                <option value="other">Other</option>
                              </select>
                            </FormField>
                            <FormField
                              label="Subtype"
                              htmlFor="item-subtype"
                              description="Optional finer tag (lamp, rope, rations, etc)."
                            >
                              <Input
                                id="item-subtype"
                                value={(selected as ItemRow).subtype ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    subtype: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                          </div>

                          <FormField
                            label="Genre Tags"
                            htmlFor="item-tags"
                            description="Comma- or space-separated tags (fantasy, sci-fi, cyberpunk…)."
                          >
                            <Input
                              id="item-tags"
                              value={(selected as ItemRow).genre_tags ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  genre_tags: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <FormField
                            label="Mechanical Effect"
                            htmlFor="item-effect"
                            description="What this does at the table: bonuses, checks, special interactions, services rendered."
                          >
                            <textarea
                              id="item-effect"
                              className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              value={
                                (selected as ItemRow).mechanical_effect ?? ""
                              }
                              onChange={(e) =>
                                updateSelected({
                                  mechanical_effect: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField label="Weight" htmlFor="item-weight">
                              <Input
                                id="item-weight"
                                type="number"
                                value={(selected as ItemRow).weight ?? ""}
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

                          <FormField
                            label="Flavor / Narrative Notes"
                            htmlFor="item-notes"
                            description="Lore hooks, description, how it feels in play. This can include anything mount/pet/companion-adjacent."
                          >
                            <textarea
                              id="item-notes"
                              className="w-full min-h-[140px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              value={
                                (selected as ItemRow).narrative_notes ?? ""
                              }
                              onChange={(e) =>
                                updateSelected({
                                  narrative_notes: e.target.value,
                                })
                              }
                            />
                          </FormField>
                        </div>
                      )}

                    {/* WEAPONS */}
                    {selected &&
                      activeTab === "weapons" &&
                      currentKind === "weapons" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              label="Timeline Tag"
                              htmlFor="weapon-timeline"
                            >
                              <Input
                                id="weapon-timeline"
                                value={(selected as WeaponRow).timeline_tag ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    timeline_tag: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                            <FormField
                              label="Cost (Credits)"
                              htmlFor="weapon-cost"
                            >
                              <Input
                                id="weapon-cost"
                                type="number"
                                value={
                                  (selected as WeaponRow).cost_credits ?? ""
                                }
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
                            <FormField
                              label="Category"
                              htmlFor="weapon-category"
                            >
                              <select
                                id="weapon-category"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                                value={(selected as WeaponRow).category ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    category: e.target.value,
                                  })
                                }
                              >
                                <option value="">(free text)</option>
                                <option value="melee">Melee</option>
                                <option value="ranged">
                                  Ranged (bows, guns, etc.)
                                </option>
                                <option value="thrown">Thrown</option>
                                <option value="improvised">Improvised</option>
                                <option value="focus">Spell Focus Weapon</option>
                                <option value="other">Other</option>
                              </select>
                            </FormField>
                            <FormField
                              label="Handedness"
                              htmlFor="weapon-hand"
                            >
                              <select
                                id="weapon-hand"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                                value={(selected as WeaponRow).handedness ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    handedness: e.target.value,
                                  })
                                }
                              >
                                <option value="">(any)</option>
                                <option value="one-handed">One-handed</option>
                                <option value="two-handed">Two-handed</option>
                                <option value="versatile">Versatile</option>
                              </select>
                            </FormField>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              label="Damage Type"
                              htmlFor="weapon-dtype"
                            >
                              <select
                                id="weapon-dtype"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                                value={(selected as WeaponRow).dtype ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    dtype: e.target.value,
                                  })
                                }
                              >
                                <option value="">(free text)</option>
                                <option value="slashing">Slashing</option>
                                <option value="piercing">Piercing</option>
                                <option value="bludgeoning">Bludgeoning</option>
                                <option value="fire">Fire</option>
                                <option value="cold">Cold</option>
                                <option value="acid">Acid</option>
                                <option value="lightning">Lightning</option>
                                <option value="psychic">Psychic</option>
                                <option value="radiant">Radiant</option>
                                <option value="necrotic">Necrotic</option>
                                <option value="force">Force</option>
                                <option value="other">Other</option>
                              </select>
                            </FormField>
                            <FormField
                              label="Damage"
                              htmlFor="weapon-damage"
                            >
                              <Input
                                id="weapon-damage"
                                type="number"
                                value={(selected as WeaponRow).damage ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    damage:
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value),
                                  })
                                }
                              />
                            </FormField>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              label="Range Type"
                              htmlFor="weapon-range-type"
                            >
                              <select
                                id="weapon-range-type"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                                value={
                                  (selected as WeaponRow).range_type ?? ""
                                }
                                onChange={(e) =>
                                  updateSelected({
                                    range_type: e.target.value,
                                  })
                                }
                              >
                                <option value="">(none)</option>
                                <option value="melee">Melee</option>
                                <option value="short">Short</option>
                                <option value="medium">Medium</option>
                                <option value="long">Long</option>
                                <option value="extreme">Extreme</option>
                                <option value="special">Special</option>
                              </select>
                            </FormField>
                            <FormField
                              label="Range Text"
                              htmlFor="weapon-range"
                              description="Optional specific bands (e.g., 30/120)."
                            >
                              <Input
                                id="weapon-range"
                                value={
                                  (selected as WeaponRow).range_text ?? ""
                                }
                                onChange={(e) =>
                                  updateSelected({
                                    range_text: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                          </div>

                          <FormField
                            label="Genre Tags"
                            htmlFor="weapon-tags"
                            description="Comma- or space-separated tags (fantasy, sci-fi, etc.)."
                          >
                            <Input
                              id="weapon-tags"
                              value={(selected as WeaponRow).genre_tags ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  genre_tags: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              label="Weight"
                              htmlFor="weapon-weight"
                            >
                              <Input
                                id="weapon-weight"
                                type="number"
                                value={(selected as WeaponRow).weight ?? ""}
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

                          <FormField
                            label="Effect"
                            htmlFor="weapon-effect"
                            description="Mechanical and dramatic impact: crit riders, status effects, etc."
                          >
                            <textarea
                              id="weapon-effect"
                              className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              value={(selected as WeaponRow).effect ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  effect: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <FormField
                            label="Narrative Notes"
                            htmlFor="weapon-notes"
                          >
                            <textarea
                              id="weapon-notes"
                              className="w-full min-h-[140px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              value={
                                (selected as WeaponRow).narrative_notes ?? ""
                              }
                              onChange={(e) =>
                                updateSelected({
                                  narrative_notes: e.target.value,
                                })
                              }
                            />
                          </FormField>
                        </div>
                      )}

                    {/* ARMOR */}
                    {selected &&
                      activeTab === "armor" &&
                      currentKind === "armor" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              label="Timeline Tag"
                              htmlFor="armor-timeline"
                            >
                              <Input
                                id="armor-timeline"
                                value={(selected as ArmorRow).timeline_tag ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    timeline_tag: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                            <FormField
                              label="Cost (Credits)"
                              htmlFor="armor-cost"
                            >
                              <Input
                                id="armor-cost"
                                type="number"
                                value={
                                  (selected as ArmorRow).cost_credits ?? ""
                                }
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
                            <FormField
                              label="Area Covered"
                              htmlFor="armor-area"
                            >
                              <Input
                                id="armor-area"
                                value={
                                  (selected as ArmorRow).area_covered ?? ""
                                }
                                onChange={(e) =>
                                  updateSelected({
                                    area_covered: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                            <FormField label="Soak" htmlFor="armor-soak">
                              <Input
                                id="armor-soak"
                                type="number"
                                value={(selected as ArmorRow).soak ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    soak:
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value),
                                  })
                                }
                              />
                            </FormField>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              label="Category"
                              htmlFor="armor-category"
                            >
                              <select
                                id="armor-category"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                                value={(selected as ArmorRow).category ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    category: e.target.value,
                                  })
                                }
                              >
                                <option value="">(free text)</option>
                                <option value="light">Light Armor</option>
                                <option value="medium">Medium Armor</option>
                                <option value="heavy">Heavy Armor</option>
                                <option value="shield">Shield</option>
                                <option value="environmental">
                                  Environmental Suit
                                </option>
                                <option value="exoskeleton">Exoskeleton</option>
                                <option value="other">Other</option>
                              </select>
                            </FormField>
                            <FormField
                              label="Armor Type"
                              htmlFor="armor-type"
                            >
                              <select
                                id="armor-type"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                                value={(selected as ArmorRow).atype ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    atype: e.target.value,
                                  })
                                }
                              >
                                <option value="">(free text)</option>
                                <option value="natural">Natural</option>
                                <option value="mundane">Mundane</option>
                                <option value="magic">Magic</option>
                                <option value="artifact">Artifact</option>
                                <option value="tech">Tech</option>
                                <option value="other">Other</option>
                              </select>
                            </FormField>
                          </div>

                          <FormField
                            label="Genre Tags"
                            htmlFor="armor-tags"
                            description="Comma- or space-separated tags."
                          >
                            <Input
                              id="armor-tags"
                              value={(selected as ArmorRow).genre_tags ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  genre_tags: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              label="Weight"
                              htmlFor="armor-weight"
                            >
                              <Input
                                id="armor-weight"
                                type="number"
                                value={(selected as ArmorRow).weight ?? ""}
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
                            <FormField
                              label="Encumbrance Penalty"
                              htmlFor="armor-enc"
                            >
                              <Input
                                id="armor-enc"
                                type="number"
                                value={
                                  (selected as ArmorRow)
                                    .encumbrance_penalty ?? ""
                                }
                                onChange={(e) =>
                                  updateSelected({
                                    encumbrance_penalty:
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value),
                                  })
                                }
                              />
                            </FormField>
                          </div>

                          <FormField
                            label="Effect"
                            htmlFor="armor-effect"
                            description="Mechanical behavior at the table."
                          >
                            <textarea
                              id="armor-effect"
                              className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              value={(selected as ArmorRow).effect ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  effect: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <FormField
                            label="Narrative Notes"
                            htmlFor="armor-notes"
                          >
                            <textarea
                              id="armor-notes"
                              className="w-full min-h-[140px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              value={
                                (selected as ArmorRow).narrative_notes ?? ""
                              }
                              onChange={(e) =>
                                updateSelected({
                                  narrative_notes: e.target.value,
                                })
                              }
                            />
                          </FormField>
                        </div>
                      )}

                    {/* ARTIFACTS */}
                    {selected &&
                      activeTab === "artifacts" &&
                      currentKind === "artifacts" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              label="Timeline Tag"
                              htmlFor="artifact-timeline"
                            >
                              <Input
                                id="artifact-timeline"
                                value={
                                  (selected as ArtifactRow).timeline_tag ?? ""
                                }
                                onChange={(e) =>
                                  updateSelected({
                                    timeline_tag: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                            <FormField
                              label="Cost (Credits)"
                              htmlFor="artifact-cost"
                            >
                              <Input
                                id="artifact-cost"
                                type="number"
                                value={
                                  (selected as ArtifactRow).cost_credits ?? ""
                                }
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
                            <FormField
                              label="Category"
                              htmlFor="artifact-category"
                            >
                              <select
                                id="artifact-category"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                                value={
                                  (selected as ArtifactRow).category ?? ""
                                }
                                onChange={(e) =>
                                  updateSelected({
                                    category: e.target.value,
                                  })
                                }
                              >
                                <option value="">(free text)</option>
                                <option value="weapon">Weapon</option>
                                <option value="armor">Armor</option>
                                <option value="wondrous">Wondrous Item</option>
                                <option value="relic">Relic</option>
                                <option value="artifact">Artifact</option>
                              </select>
                            </FormField>
                            <FormField
                              label="Rarity"
                              htmlFor="artifact-rarity"
                            >
                              <select
                                id="artifact-rarity"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                                value={(selected as ArtifactRow).rarity ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    rarity: e.target.value,
                                  })
                                }
                              >
                                <option value="">(unset)</option>
                                <option value="common">Common</option>
                                <option value="uncommon">Uncommon</option>
                                <option value="rare">Rare</option>
                                <option value="very_rare">Very Rare</option>
                                <option value="legendary">Legendary</option>
                                <option value="mythic">Mythic</option>
                                <option value="unique">Unique</option>
                              </select>
                            </FormField>
                          </div>

                          <FormField
                            label="Attunement"
                            htmlFor="artifact-attunement"
                            description="Requirements, costs, and limits for wielding this artifact."
                          >
                            <Input
                              id="artifact-attunement"
                              value={
                                (selected as ArtifactRow).attunement ?? ""
                              }
                              onChange={(e) =>
                                updateSelected({
                                  attunement: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <FormField
                            label="Genre Tags"
                            htmlFor="artifact-tags"
                          >
                            <Input
                              id="artifact-tags"
                              value={(selected as ArtifactRow).genre_tags ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  genre_tags: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <FormField
                            label="Mechanical Effect"
                            htmlFor="artifact-effect"
                            description="How this relic actually behaves at the table."
                          >
                            <textarea
                              id="artifact-effect"
                              className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              value={
                                (selected as ArtifactRow).mechanical_effect ??
                                ""
                              }
                              onChange={(e) =>
                                updateSelected({
                                  mechanical_effect: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <FormField
                            label="Curse / Drawbacks"
                            htmlFor="artifact-curse"
                            description="Side effects, madness, corruption, or obligations tied to this artifact."
                          >
                            <textarea
                              id="artifact-curse"
                              className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              value={(selected as ArtifactRow).curse ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  curse: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <FormField
                            label="Origin Lore"
                            htmlFor="artifact-origin"
                            description="Where this artifact came from, who forged it, and why it matters."
                          >
                            <textarea
                              id="artifact-origin"
                              className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              value={
                                (selected as ArtifactRow).origin_lore ?? ""
                              }
                              onChange={(e) =>
                                updateSelected({
                                  origin_lore: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              label="Weight"
                              htmlFor="artifact-weight"
                            >
                              <Input
                                id="artifact-weight"
                                type="number"
                                value={(selected as ArtifactRow).weight ?? ""}
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

                          <FormField
                            label="Narrative Notes"
                            htmlFor="artifact-notes"
                            description="Extra flavor, GM guidance, or how the artifact should feel at the table."
                          >
                            <textarea
                              id="artifact-notes"
                              className="w-full min-h-[140px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              value={
                                (selected as ArtifactRow).narrative_notes ?? ""
                              }
                              onChange={(e) =>
                                updateSelected({
                                  narrative_notes: e.target.value,
                                })
                              }
                            />
                          </FormField>
                        </div>
                      )}

                    {/* SERVICES */}
                    {selected &&
                      activeTab === "services" &&
                      currentKind === "services" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              label="Timeline Tag"
                              htmlFor="service-timeline"
                            >
                              <Input
                                id="service-timeline"
                                value={
                                  (selected as ServiceRow).timeline_tag ?? ""
                                }
                                onChange={(e) =>
                                  updateSelected({
                                    timeline_tag: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                            <FormField
                              label="Cost (Credits)"
                              htmlFor="service-cost"
                            >
                              <Input
                                id="service-cost"
                                type="number"
                                value={
                                  (selected as ServiceRow).cost_credits ?? ""
                                }
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
                            <FormField
                              label="Service Category"
                              htmlFor="service-category"
                            >
                              <select
                                id="service-category"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                                value={(selected as ServiceRow).category ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    category: e.target.value,
                                  })
                                }
                              >
                                <option value="">(free text)</option>
                                <option value="travel">Travel</option>
                                <option value="lodging">Lodging</option>
                                <option value="healing">Healing</option>
                                <option value="information">Information</option>
                                <option value="crafting">Crafting</option>
                                <option value="magic_service">
                                  Magic / Ritual
                                </option>
                                <option value="other">Other</option>
                              </select>
                            </FormField>
                            <FormField
                              label="Duration / Scope"
                              htmlFor="service-duration"
                            >
                              <Input
                                id="service-duration"
                                value={
                                  (selected as ServiceRow).duration ?? ""
                                }
                                onChange={(e) =>
                                  updateSelected({
                                    duration: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                          </div>

                          <FormField
                            label="Genre Tags"
                            htmlFor="service-tags"
                          >
                            <Input
                              id="service-tags"
                              value={(selected as ServiceRow).genre_tags ?? ""}
                              onChange={(e) =>
                                updateSelected({
                                  genre_tags: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <FormField
                            label="Mechanical Effect"
                            htmlFor="service-effect"
                            description="What this service guarantees or enables mechanically."
                          >
                            <textarea
                              id="service-effect"
                              className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              value={
                                (selected as ServiceRow).mechanical_effect ?? ""
                              }
                              onChange={(e) =>
                                updateSelected({
                                  mechanical_effect: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <FormField
                            label="Narrative Notes"
                            htmlFor="service-notes"
                            description="How this service feels, who offers it, and what strings might be attached."
                          >
                            <textarea
                              id="service-notes"
                              className="w-full min-h-[140px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              value={
                                (selected as ServiceRow).narrative_notes ?? ""
                              }
                              onChange={(e) =>
                                updateSelected({
                                  narrative_notes: e.target.value,
                                })
                              }
                            />
                          </FormField>
                        </div>
                      )}

                    {/* COMPANIONS */}
                    {selected &&
                      activeTab === "companions" &&
                      currentKind === "companions" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              label="Timeline Tag"
                              htmlFor="companion-timeline"
                            >
                              <Input
                                id="companion-timeline"
                                value={
                                  (selected as CompanionRow).timeline_tag ?? ""
                                }
                                onChange={(e) =>
                                  updateSelected({
                                    timeline_tag: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                            <FormField
                              label="Cost (Credits)"
                              htmlFor="companion-cost"
                            >
                              <Input
                                id="companion-cost"
                                type="number"
                                value={
                                  (selected as CompanionRow).cost_credits ?? ""
                                }
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
                            <FormField
                              label="Role"
                              htmlFor="companion-role"
                              description="Whether this is a pet, a mount, or a full companion."
                            >
                              <select
                                id="companion-role"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                                value={(selected as CompanionRow).role ?? ""}
                                onChange={(e) =>
                                  updateSelected({
                                    role: e.target.value,
                                  })
                                }
                              >
                                <option value="">(unset)</option>
                                <option value="pet">Pet</option>
                                <option value="mount">Mount</option>
                                <option value="companion">Companion</option>
                              </select>
                            </FormField>
                            <FormField
                              label="Linked Creature ID"
                              htmlFor="companion-creature"
                              description="Later this will pull from your Creatures DB; for now, use a key or id."
                            >
                              <Input
                                id="companion-creature"
                                value={
                                  (selected as CompanionRow).linked_creature_id ??
                                  ""
                                }
                                onChange={(e) =>
                                  updateSelected({
                                    linked_creature_id: e.target.value,
                                  })
                                }
                              />
                            </FormField>
                          </div>

                          <FormField
                            label="Genre Tags"
                            htmlFor="companion-tags"
                          >
                            <Input
                              id="companion-tags"
                              value={
                                (selected as CompanionRow).genre_tags ?? ""
                              }
                              onChange={(e) =>
                                updateSelected({
                                  genre_tags: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <FormField
                            label="Mechanical Effect"
                            htmlFor="companion-effect"
                            description="Bonuses, extra actions, travel advantages, etc. that this companion brings."
                          >
                            <textarea
                              id="companion-effect"
                              className="w-full min-h-[120px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              value={
                                (selected as CompanionRow).mechanical_effect ??
                                ""
                              }
                              onChange={(e) =>
                                updateSelected({
                                  mechanical_effect: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <FormField
                            label="Care / Logistics"
                            htmlFor="companion-care"
                            description="Upkeep, stabling, food, temperament, or any leash the GM can tug on."
                          >
                            <textarea
                              id="companion-care"
                              className="w-full min-h-[100px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              value={
                                (selected as CompanionRow).care_difficulty ?? ""
                              }
                              onChange={(e) =>
                                updateSelected({
                                  care_difficulty: e.target.value,
                                })
                              }
                            />
                          </FormField>

                          <FormField
                            label="Narrative Notes"
                            htmlFor="companion-notes"
                          >
                            <textarea
                              id="companion-notes"
                              className="w-full min-h-[140px] rounded-lg border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                              value={
                                (selected as CompanionRow).narrative_notes ?? ""
                              }
                              onChange={(e) =>
                                updateSelected({
                                  narrative_notes: e.target.value,
                                })
                              }
                            />
                          </FormField>
                        </div>
                      )}

                    {/* PREVIEW */}
                    {selected && activeTab === "preview" && (
                      <div>
                        <FormField
                          label="Inventory Preview"
                          htmlFor="inventory-preview"
                          description="Quick text block you can drop into sheets, handouts, or modules."
                        >
                          <textarea
                            id="inventory-preview"
                            readOnly
                            value={previewText}
                            className="w-full h-[400px] rounded-lg border border-white/10 bg-neutral-950/70 px-3 py-2 text-xs text-zinc-200 font-mono"
                          />
                        </FormField>

                        <div className="mt-2 text-[11px] text-zinc-500">
                          Items, weapons, armor, artifacts, services, and
                          companions all share the same builder shell here. Down
                          the line, DB tables will mirror these fields and link
                          into races, creatures, shops, and campaign packs.
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </Card>
      </section>
    </main>
  );
}
