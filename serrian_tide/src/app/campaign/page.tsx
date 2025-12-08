"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { GradientText } from "@/components/GradientText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Tabs } from "@/components/Tabs";

type Currency = {
  id: string;
  name: string;
  symbol: string;
  creditValue: number;
};

type CampaignCharacter = {
  id: string;
  name: string;
  playerId: string;
};

type CampaignPlayer = {
  id: string;
  userId: string;
  userName: string;
  characters: CampaignCharacter[];
};

type Campaign = {
  id: string | number;
  name: string;
  genre?: string | null;
  attributePoints: number;
  skillPoints: number;
  maxPointsInSkill?: number | null;
  pointsNeededForNextTier?: number | null;
  maxAllowedInTier?: number | null;
  startingCredits?: number | null;
  tier1Enabled: boolean;
  tier2Enabled: boolean;
  tier3Enabled: boolean;
  spellcraftEnabled: boolean;
  talismanismEnabled: boolean;
  faithEnabled: boolean;
  psyonicsEnabled: boolean;
  bardicResonancesEnabled: boolean;
  specialAbilitiesEnabled: boolean;
  currencies: Currency[];
  allowedRaces: string[];
  players: CampaignPlayer[];
};

const GENRES = [
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
  "Custom/Other",
];

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("campaign");
  const [qtext, setQtext] = useState("");
  const [showAddPlayerDropdown, setShowAddPlayerDropdown] = useState(false);
  const [activeUsers, setActiveUsers] = useState<{ id: string; name: string }[]>([]);
  const [availableRaces, setAvailableRaces] = useState<{ id: string; name: string; tagline: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Gear shop state
  type ShopItem = {
    id: string;
    name: string;
    type: string;
    rarity?: string;
    cost: number;
    genreTags?: string;
    storeItemId?: string; // ID in campaign_store_items table
  };
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [availableItems, setAvailableItems] = useState<ShopItem[]>([]);
  const [itemTypeFilter, setItemTypeFilter] = useState("all");
  const [itemGenreFilter, setItemGenreFilter] = useState("all");
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [isSavingStore, setIsSavingStore] = useState(false);

  // Archetype state
  type Archetype = {
    id: string;
    name: string;
    description?: string;
    attributes: { [key: string]: number };
    skills: Array<{ skillId: string; skillName: string; points: number }>;
    spellcraftGuidance?: string;
    talismanismGuidance?: string;
    faithGuidance?: string;
    psonicsGuidance?: string;
    bardicGuidance?: string;
  };
  const [archetypes, setArchetypes] = useState<Archetype[]>([]);
  const [allSkills, setAllSkills] = useState<any[]>([]);
  const [showArchetypeModal, setShowArchetypeModal] = useState(false);
  const [newArchetype, setNewArchetype] = useState<Archetype>({
    id: '',
    name: '',
    description: '',
    attributes: { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
    skills: [],
    spellcraftGuidance: '',
    talismanismGuidance: '',
    faithGuidance: '',
    psonicsGuidance: '',
    bardicGuidance: '',
  });
  const [editingArchetype, setEditingArchetype] = useState<string | null>(null);
  const [isSavingArchetype, setIsSavingArchetype] = useState(false);

  // Fetch campaigns on mount
  useEffect(() => {
    fetchCampaigns();
    fetchActiveUsers();
    fetchAvailableRaces();
    fetchAllSkills();
    fetchAvailableInventory();
  }, []);

  // Load store items when campaign is selected
  useEffect(() => {
    if (selectedId) {
      fetchCampaignStoreItems(selectedId);
    } else {
      setShopItems([]);
    }
  }, [selectedId]);

  async function fetchCampaigns() {
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      if (data.ok) {
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchActiveUsers() {
    try {
      const res = await fetch("/api/users/active");
      const data = await res.json();
      if (data.ok) {
        setActiveUsers(data.users.map((u: any) => ({ id: u.id, name: u.username })));
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }

  async function fetchAvailableRaces() {
    try {
      const res = await fetch("/api/campaigns/available-races");
      const data = await res.json();
      if (data.ok) {
        setAvailableRaces(data.races || []);
      }
    } catch (err) {
      console.error("Failed to fetch available races:", err);
    }
  }

  async function fetchAvailableInventory() {
    try {
      const [itemsRes, weaponsRes, armorRes] = await Promise.all([
        fetch("/api/worldbuilder/inventory/items"),
        fetch("/api/worldbuilder/inventory/weapons"),
        fetch("/api/worldbuilder/inventory/armor"),
      ]);
      
      const [itemsData, weaponsData, armorData] = await Promise.all([
        itemsRes.json(),
        weaponsRes.json(),
        armorRes.json(),
      ]);
      
      const allItems: ShopItem[] = [];
      
      if (itemsData.ok && itemsData.items) {
        allItems.push(...itemsData.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          type: "Item",
          cost: item.costCredits || 0,
          genreTags: item.genreTags,
        })));
      }
      
      if (weaponsData.ok && weaponsData.weapons) {
        allItems.push(...weaponsData.weapons.map((weapon: any) => ({
          id: weapon.id,
          name: weapon.name,
          type: "Weapon",
          rarity: weapon.rarity,
          cost: weapon.costCredits || 0,
          genreTags: weapon.genreTags,
        })));
      }
      
      if (armorData.ok && armorData.armor) {
        allItems.push(...armorData.armor.map((armor: any) => ({
          id: armor.id,
          name: armor.name,
          type: "Armor",
          rarity: armor.rarity,
          cost: armor.costCredits || 0,
          genreTags: armor.genreTags,
        })));
      }
      
      setAvailableItems(allItems);
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    }
  }

  async function fetchCampaignStoreItems(campaignId: string) {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/store`);
      const data = await res.json();
      if (data.ok && data.items) {
        // Convert store items to ShopItem format
        const items: ShopItem[] = data.items.map((item: any) => ({
          id: item.sourceId,
          name: item.name,
          type: item.itemType,
          cost: item.costCredits,
          storeItemId: item.id, // Keep track of the store item ID for deletion
        }));
        setShopItems(items);
      }
    } catch (err) {
      console.error("Failed to fetch campaign store items:", err);
    }
  }

  async function saveCampaignStoreItems(campaignId: string, items: ShopItem[]) {
    try {
      setIsSavingStore(true);
      console.log('Saving store items:', { campaignId, itemCount: items.length });
      
      const payload = items.map(item => ({
        sourceType: item.type.toLowerCase(), // 'weapon', 'armor', 'item'
        sourceId: item.id,
        name: item.name,
        itemType: item.type,
        costCredits: item.cost,
      }));

      const res = await fetch(`/api/campaigns/${campaignId}/store`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });

      const data = await res.json();
      console.log('Save store items response:', data);
      
      if (data.ok) {
        // Refresh store items to get the stored IDs
        await fetchCampaignStoreItems(campaignId);
      } else {
        console.error('Failed to save store items:', data.error);
      }
    } catch (err) {
      console.error("Failed to save campaign store items:", err);
    } finally {
      setIsSavingStore(false);
    }
  }

  async function fetchAllSkills() {
    try {
      const res = await fetch("/api/worldbuilder/skills");
      const data = await res.json();
      if (data.ok && data.skills) {
        // Filter to only tier 1 skills
        const tier1Skills = data.skills.filter((s: any) => s.tier === 1);
        setAllSkills(tier1Skills);
      }
    } catch (err) {
      console.error("Failed to fetch skills:", err);
    }
  }

  async function fetchCampaignArchetypes(campaignId: string) {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/archetypes`);
      const data = await res.json();
      if (data.ok && data.archetypes) {
        setArchetypes(data.archetypes);
      }
    } catch (err) {
      console.error("Failed to fetch archetypes:", err);
    }
  }

  async function saveArchetype(campaignId: string, archetype: Archetype) {
    try {
      setIsSavingArchetype(true);
      
      const isNew = !archetype.id;
      const method = isNew ? "POST" : "PUT";
      const url = isNew 
        ? `/api/campaigns/${campaignId}/archetypes`
        : `/api/campaigns/${campaignId}/archetypes/${archetype.id}`;
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(archetype),
      });
      
      const data = await res.json();
      if (data.ok) {
        await fetchCampaignArchetypes(campaignId);
        setShowArchetypeModal(false);
        setEditingArchetype(null);
        setNewArchetype({
          id: '',
          name: '',
          description: '',
          attributes: { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
          skills: [],
          spellcraftGuidance: '',
          talismanismGuidance: '',
          faithGuidance: '',
          psonicsGuidance: '',
          bardicGuidance: '',
        });
      } else {
        console.error('Failed to save archetype:', data.error);
      }
    } catch (err) {
      console.error("Failed to save archetype:", err);
    } finally {
      setIsSavingArchetype(false);
    }
  }

  async function deleteArchetype(campaignId: string, archetypeId: string) {
    try {
      setIsSavingArchetype(true);
      const res = await fetch(`/api/campaigns/${campaignId}/archetypes/${archetypeId}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      if (data.ok) {
        await fetchCampaignArchetypes(campaignId);
      } else {
        console.error('Failed to delete archetype:', data.error);
      }
    } catch (err) {
      console.error("Failed to delete archetype:", err);
    } finally {
      setIsSavingArchetype(false);
    }
  }

  async function removeCampaignStoreItem(campaignId: string, storeItemId: string) {
    try {
      setIsSavingStore(true);
      console.log('Removing store item:', { campaignId, storeItemId });
      
      const res = await fetch(`/api/campaigns/${campaignId}/store/${storeItemId}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      console.log('Remove store item response:', data);
      
      if (!data.ok) {
        console.error('Failed to remove store item:', data.error);
      }
    } catch (err) {
      console.error("Failed to remove campaign store item:", err);
    } finally {
      setIsSavingStore(false);
    }
  }

  async function fetchCampaignDetails(id: string) {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      const data = await res.json();
      if (data.ok && data.campaign) {
        // Update the campaign in the list with full details
        setCampaigns((prev) =>
          prev.map((c) => (String(c.id) === String(id) ? data.campaign : c))
        );
      }
    } catch (err) {
      console.error("Failed to fetch campaign details:", err);
    }
  }

  const tabs = [
    { id: "campaign", label: "Campaign" },
    { id: "players", label: "Players & Characters" },
    { id: "gear", label: "Starting Gear Shop" },
    { id: "archetypes", label: "Archetypes" },
    { id: "preview", label: "Preview" },
    { id: "rewards", label: "Assign EXP & Quintessence" },
  ];

  const selected: Campaign | null = useMemo(
    () =>
      campaigns.find((c) => String(c.id) === String(selectedId ?? "")) ?? null,
    [campaigns, selectedId]
  );

  // Fetch full campaign details when selection changes
  useEffect(() => {
    if (selectedId && selected && (!selected.players || !selected.currencies)) {
      fetchCampaignDetails(selectedId);
      fetchCampaignArchetypes(selectedId);
      fetchCampaignStoreItems(selectedId);
    }
  }, [selectedId]);

  const filteredList = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter((c) =>
      c.name.toLowerCase().includes(q)
    );
  }, [campaigns, qtext]);

  async function createCampaign() {
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Campaign",
          attributePoints: 150,
          skillPoints: 50,
        }),
      });
      const data = await res.json();
      if (data.ok && data.campaign) {
        setCampaigns((prev) => [data.campaign, ...prev]);
        setSelectedId(data.campaign.id);
      }
    } catch (err) {
      console.error("Failed to create campaign:", err);
    }
  }

  async function deleteCampaign() {
    if (!selected || !confirm(`Delete "${selected.name}"? This cannot be undone.`)) return;
    
    try {
      const res = await fetch(`/api/campaigns/${selected.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        setCampaigns((prev) => prev.filter((c) => String(c.id) !== String(selected.id)));
        setSelectedId(null);
      }
    } catch (err) {
      console.error("Failed to delete campaign:", err);
      alert("Failed to delete campaign. Please try again.");
    }
  }

  async function updateCampaign(updates: Partial<Campaign>) {
    if (!selectedId || !selected) return;
    
    // Optimistically update UI
    setCampaigns((prev) =>
      prev.map((c) =>
        String(c.id) === String(selectedId) ? { ...c, ...updates } : c
      )
    );

    // Save to API
    try {
      await fetch(`/api/campaigns/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error("Failed to update campaign:", err);
      // Revert on error
      fetchCampaignDetails(selectedId);
    }
  }

  async function addPlayerToCampaign(userId: string, userName: string) {
    if (!selected) return;
    
    try {
      const res = await fetch(`/api/campaigns/${selected.id}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.ok && data.player) {
        updateCampaign({ players: [...(selected.players || []), data.player] });
        setShowAddPlayerDropdown(false);
      }
    } catch (err) {
      console.error("Failed to add player:", err);
    }
  }

  async function addCharacterToPlayer(playerId: string) {
    if (!selected) return;
    
    try {
      const res = await fetch(`/api/campaigns/${selected.id}/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, name: "New Character" }),
      });
      const data = await res.json();
      if (data.ok && data.character) {
        const updatedPlayers = (selected.players || []).map((p) =>
          p.id === playerId
            ? { ...p, characters: [...p.characters, data.character] }
            : p
        );
        updateCampaign({ players: updatedPlayers });
      }
    } catch (err) {
      console.error("Failed to add character:", err);
    }
  }

  async function removePlayerFromCampaign(playerId: string) {
    if (!selected) return;
    
    try {
      await fetch(`/api/campaigns/${selected.id}/players?playerId=${playerId}`, {
        method: "DELETE",
      });
      const updatedPlayers = (selected.players || []).filter((p) => p.id !== playerId);
      updateCampaign({ players: updatedPlayers });
    } catch (err) {
      console.error("Failed to remove player:", err);
    }
  }

  async function removeCharacterFromPlayer(playerId: string, characterId: string) {
    if (!selected) return;
    
    try {
      await fetch(`/api/campaigns/${selected.id}/characters?characterId=${characterId}`, {
        method: "DELETE",
      });
      const updatedPlayers = (selected.players || []).map((p) =>
        p.id === playerId
          ? { ...p, characters: p.characters.filter((c) => c.id !== characterId) }
          : p
      );
      updateCampaign({ players: updatedPlayers });
    } catch (err) {
      console.error("Failed to remove character:", err);
    }
  }

  async function updateCharacterName(playerId: string, characterId: string, newName: string) {
    if (!selected) return;
    
    // Optimistically update UI
    const updatedPlayers = (selected.players || []).map((p) =>
      p.id === playerId
        ? {
            ...p,
            characters: p.characters.map((c) =>
              c.id === characterId ? { ...c, name: newName } : c
            ),
          }
        : p
    );
    updateCampaign({ players: updatedPlayers });

    // Save to API
    try {
      await fetch(`/api/campaigns/${selected.id}/characters`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, name: newName }),
      });
    } catch (err) {
      console.error("Failed to update character:", err);
    }
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
              The Gods' Realm
            </GradientText>
            <p className="mt-1 text-sm text-zinc-300/90 max-w-2xl">
              Design arcs, sessions, and encounters for your campaigns.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Link href="/dashboard">
              <Button variant="secondary" size="sm" type="button">
                ← Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
        {/* LEFT: Campaign Library */}
        <Card
          padded={false}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-200">
              Campaign Library
            </h2>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={createCampaign}
            >
              + New
            </Button>
          </div>

          {/* Filter */}
          <div className="space-y-2">
            <Input
              value={qtext}
              onChange={(e) => setQtext(e.target.value)}
              placeholder="Search campaigns…"
            />
          </div>

          {/* List */}
          <div className="mt-2 flex-1 min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-400 border-b border-white/10">
              <span>Campaigns: {filteredList.length}</span>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {filteredList.length === 0 ? (
                <div className="p-4 text-center text-sm text-zinc-500">
                  No campaigns yet. Click "+ New" to create one.
                </div>
              ) : (
                filteredList.map((c) => {
                  const isActive = String(c.id) === String(selectedId);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedId(String(c.id))}
                      className={`w-full px-3 py-2 text-left text-sm border-b border-white/5 transition ${
                        isActive
                          ? "bg-amber-400/10 text-amber-200"
                          : "text-zinc-300 hover:bg-white/5"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </Card>

        {/* RIGHT: Campaign Details */}
        <div className="flex flex-col gap-6">
          {!selected ? (
            <Card className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-center text-zinc-400">
                Select a campaign from the library or create a new one.
              </p>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Tabs
                  tabs={tabs}
                  activeId={activeTab}
                  onChange={setActiveTab}
                />
                <Button
                  variant="danger"
                  size="sm"
                  type="button"
                  onClick={deleteCampaign}
                >
                  Delete Campaign
                </Button>
              </div>

              <div className="mt-2">
                {activeTab === "campaign" && (
                  <Card className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <h2 className="text-xl font-semibold mb-6">Campaign Settings</h2>
                    
                    <div className="space-y-6">
                      {/* Campaign Name */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Campaign Name
                        </label>
                        <Input
                          value={selected.name}
                          onChange={(e) => updateCampaign({ name: e.target.value })}
                          placeholder="Enter campaign name"
                        />
                      </div>

                      {/* Genre */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Genre
                        </label>
                        <select
                          value={selected.genre ?? ""}
                          onChange={(e) =>
                            updateCampaign({
                              genre: e.target.value || null,
                            })
                          }
                          className="w-full px-4 py-2 rounded-xl bg-black/30 border border-white/10 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition"
                        >
                          <option value="">Select a genre...</option>
                          {GENRES.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Starting Character Configuration */}
                      <div className="pt-4 border-t border-white/10">
                        <h3 className="text-lg font-semibold text-zinc-200 mb-4">
                          Starting Character Configuration
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Attribute Points */}
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                              Attribute Points
                            </label>
                            <Input
                              type="number"
                              value={selected.attributePoints}
                              onChange={(e) =>
                                updateCampaign({
                                  attributePoints: e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : 150,
                                })
                              }
                              placeholder="150"
                            />
                          </div>

                          {/* Skill Points */}
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                              Skill Points
                            </label>
                            <Input
                              type="number"
                              value={selected.skillPoints}
                              onChange={(e) =>
                                updateCampaign({
                                  skillPoints: e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : 50,
                                })
                              }
                              placeholder="50"
                            />
                          </div>

                          {/* Max Points in Any Skill */}
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                              Max Points in Any Skill
                            </label>
                            <Input
                              type="number"
                              value={selected.maxPointsInSkill ?? ""}
                              onChange={(e) =>
                                updateCampaign({
                                  maxPointsInSkill: e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : null,
                                })
                              }
                              placeholder="e.g., 10"
                            />
                          </div>

                          {/* Points Needed for Next Tier */}
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                              Needed for Next Tier
                            </label>
                            <Input
                              type="number"
                              value={selected.pointsNeededForNextTier ?? ""}
                              onChange={(e) =>
                                updateCampaign({
                                  pointsNeededForNextTier: e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : null,
                                })
                              }
                              placeholder="e.g., 5"
                            />
                          </div>

                          {/* Max Allowed in Tier */}
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                              Max Allowed in Tier
                            </label>
                            <Input
                              type="number"
                              value={selected.maxAllowedInTier ?? ""}
                              onChange={(e) =>
                                updateCampaign({
                                  maxAllowedInTier: e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : null,
                                })
                              }
                              placeholder="e.g., 3"
                            />
                          </div>

                          {/* Starting Credits */}
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                              Starting Credits
                            </label>
                            <Input
                              type="number"
                              value={selected.startingCredits ?? ""}
                              onChange={(e) =>
                                updateCampaign({
                                  startingCredits: e.target.value
                                    ? parseInt(e.target.value, 10)
                                    : null,
                                })
                              }
                              placeholder="e.g., 1000"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tier & System Checkboxes */}
                      <div className="pt-4 border-t border-white/10">
                        <h3 className="text-lg font-semibold text-zinc-200 mb-4">
                          Enable Systems & Tiers
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {/* Tier 1 */}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected.tier1Enabled}
                              onChange={(e) =>
                                updateCampaign({ tier1Enabled: e.target.checked })
                              }
                              className="w-4 h-4 rounded border-white/20 bg-black/30 text-amber-400 focus:ring-2 focus:ring-amber-400/50"
                            />
                            <span className="text-sm text-zinc-300">Tier 1</span>
                          </label>

                          {/* Tier 2 */}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected.tier2Enabled}
                              onChange={(e) =>
                                updateCampaign({ tier2Enabled: e.target.checked })
                              }
                              className="w-4 h-4 rounded border-white/20 bg-black/30 text-amber-400 focus:ring-2 focus:ring-amber-400/50"
                            />
                            <span className="text-sm text-zinc-300">Tier 2</span>
                          </label>

                          {/* Tier 3 */}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected.tier3Enabled}
                              onChange={(e) =>
                                updateCampaign({ tier3Enabled: e.target.checked })
                              }
                              className="w-4 h-4 rounded border-white/20 bg-black/30 text-amber-400 focus:ring-2 focus:ring-amber-400/50"
                            />
                            <span className="text-sm text-zinc-300">Tier 3</span>
                          </label>

                          {/* Spellcraft */}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected.spellcraftEnabled}
                              onChange={(e) =>
                                updateCampaign({ spellcraftEnabled: e.target.checked })
                              }
                              className="w-4 h-4 rounded border-white/20 bg-black/30 text-amber-400 focus:ring-2 focus:ring-amber-400/50"
                            />
                            <span className="text-sm text-zinc-300">Spellcraft</span>
                          </label>

                          {/* Talismanism */}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected.talismanismEnabled}
                              onChange={(e) =>
                                updateCampaign({ talismanismEnabled: e.target.checked })
                              }
                              className="w-4 h-4 rounded border-white/20 bg-black/30 text-amber-400 focus:ring-2 focus:ring-amber-400/50"
                            />
                            <span className="text-sm text-zinc-300">Talismanism</span>
                          </label>

                          {/* Faith */}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected.faithEnabled}
                              onChange={(e) =>
                                updateCampaign({ faithEnabled: e.target.checked })
                              }
                              className="w-4 h-4 rounded border-white/20 bg-black/30 text-amber-400 focus:ring-2 focus:ring-amber-400/50"
                            />
                            <span className="text-sm text-zinc-300">Faith</span>
                          </label>

                          {/* Psyonics */}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected.psyonicsEnabled}
                              onChange={(e) =>
                                updateCampaign({ psyonicsEnabled: e.target.checked })
                              }
                              className="w-4 h-4 rounded border-white/20 bg-black/30 text-amber-400 focus:ring-2 focus:ring-amber-400/50"
                            />
                            <span className="text-sm text-zinc-300">Psyonics</span>
                          </label>

                          {/* Bardic Resonances */}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected.bardicResonancesEnabled}
                              onChange={(e) =>
                                updateCampaign({ bardicResonancesEnabled: e.target.checked })
                              }
                              className="w-4 h-4 rounded border-white/20 bg-black/30 text-amber-400 focus:ring-2 focus:ring-amber-400/50"
                            />
                            <span className="text-sm text-zinc-300">Bardic Resonances</span>
                          </label>

                          {/* Special Abilities */}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected.specialAbilitiesEnabled}
                              onChange={(e) =>
                                updateCampaign({ specialAbilitiesEnabled: e.target.checked })
                              }
                              className="w-4 h-4 rounded border-white/20 bg-black/30 text-amber-400 focus:ring-2 focus:ring-amber-400/50"
                            />
                            <span className="text-sm text-zinc-300">Special Abilities</span>
                          </label>
                        </div>
                      </div>

                      {/* Currency System */}
                      <div className="pt-4 border-t border-white/10">
                        <h3 className="text-lg font-semibold text-zinc-200 mb-4">
                          System Standard Currency 1 - Create a Currency System
                        </h3>

                        <div className="space-y-3">
                          {(selected.currencies || []).map((currency, idx) => (
                            <div key={currency.id} className="flex gap-3 items-end">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                  Currency Name
                                </label>
                                <Input
                                  value={currency.name}
                                  onChange={(e) => {
                                    const updated = [...selected.currencies];
                                    if (updated[idx]) {
                                      updated[idx].name = e.target.value;
                                    }
                                    updateCampaign({ currencies: updated });
                                  }}
                                  placeholder="e.g., Mitheral Piece"
                                />
                              </div>
                              <div className="w-24">
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                  Symbol
                                </label>
                                <Input
                                  value={currency.symbol || ""}
                                  onChange={(e) => {
                                    const updated = [...selected.currencies];
                                    if (updated[idx]) {
                                      updated[idx].symbol = e.target.value;
                                    }
                                    updateCampaign({ currencies: updated });
                                  }}
                                  placeholder="MP"
                                  maxLength={10}
                                />
                              </div>
                              <div className="w-32">
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                  Credit Value
                                </label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={currency.creditValue}
                                  onChange={(e) => {
                                    const updated = [...selected.currencies];
                                    if (updated[idx]) {
                                      updated[idx].creditValue = e.target.value
                                        ? parseFloat(e.target.value)
                                        : 0;
                                    }
                                    updateCampaign({ currencies: updated });
                                  }}
                                  placeholder="0"
                                />
                              </div>
                              <Button
                                variant="secondary"
                                size="sm"
                                type="button"
                                onClick={() => {
                                  const updated = selected.currencies.filter(
                                    (c) => c.id !== currency.id
                                  );
                                  updateCampaign({ currencies: updated });
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}

                          <Button
                            variant="primary"
                            size="sm"
                            type="button"
                            onClick={() => {
                              const newCurrency: Currency = {
                                id: Math.random().toString(36).slice(2, 10),
                                name: "",
                                symbol: "",
                                creditValue: 1,
                              };
                              updateCampaign({
                                currencies: [...(selected.currencies || []), newCurrency],
                              });
                            }}
                          >
                            + Add Currency
                          </Button>
                        </div>
                      </div>

                      {/* Allowed Races */}
                      <div className="pt-4 border-t border-white/10">
                        <h3 className="text-lg font-semibold text-zinc-200 mb-4">
                          Allowed Races
                        </h3>
                        <p className="text-sm text-zinc-400 mb-4">
                          Select which races are allowed in this campaign. Only free races, races you've created, or races you've purchased are available.
                        </p>
                        <div className="p-4 rounded-xl bg-black/20 border border-white/10 max-h-[400px] overflow-y-auto">
                          {availableRaces.length === 0 ? (
                            <p className="text-sm text-zinc-500">
                              No races available. Create races in the Worldbuilder to make them available here.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {availableRaces.map((race) => {
                                const isSelected = (selected.allowedRaces || []).includes(race.id);
                                return (
                                  <label
                                    key={race.id}
                                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                      isSelected
                                        ? "bg-violet-500/10 border-violet-500/50"
                                        : "bg-black/20 border-white/10 hover:border-white/20"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        const currentRaces = selected.allowedRaces || [];
                                        const newRaces = e.target.checked
                                          ? [...currentRaces, race.id]
                                          : currentRaces.filter((id) => id !== race.id);
                                        updateCampaign({ allowedRaces: newRaces });
                                      }}
                                      className="mt-0.5 w-4 h-4 rounded border-white/20 bg-black/30 text-violet-500 focus:ring-violet-500/50"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm text-zinc-200">
                                        {race.name}
                                      </div>
                                      {race.tagline && (
                                        <div className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                                          {race.tagline}
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="pt-4 border-t border-white/10 flex justify-end">
                        <Button
                          variant="primary"
                          size="md"
                          type="button"
                          onClick={async () => {
                            if (!selected) return;
                            try {
                              await updateCampaign({});
                              alert("Campaign saved successfully!");
                            } catch (err) {
                              alert("Failed to save campaign. Please try again.");
                            }
                          }}
                        >
                          Save Campaign
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {activeTab === "players" && (
                  <Card className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">Players & Characters</h2>
                      <div className="relative">
                        <Button
                          variant="primary"
                          size="sm"
                          type="button"
                          onClick={() => setShowAddPlayerDropdown(!showAddPlayerDropdown)}
                        >
                          + Add Player
                        </Button>
                        {showAddPlayerDropdown && (
                          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-zinc-900 border border-white/10 shadow-2xl z-10 max-h-60 overflow-y-auto">
                            {activeUsers
                              .filter(
                                (user) =>
                                  !(selected.players || []).some((p) => p.userId === user.id)
                              )
                              .map((user) => (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => addPlayerToCampaign(user.id, user.name)}
                                  className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 border-b border-white/5 last:border-b-0 transition"
                                >
                                  {user.name}
                                </button>
                              ))}
                            {activeUsers.filter(
                              (user) => !(selected.players || []).some((p) => p.userId === user.id)
                            ).length === 0 && (
                              <div className="px-4 py-3 text-sm text-zinc-500 text-center">
                                All active users already added
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {(selected.players || []).length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 border border-dashed border-white/10 rounded-xl">
                          No players added yet. Click "+ Add Player" to add players to this campaign.
                        </div>
                      ) : (
                        (selected.players || []).map((player) => (
                          <div
                            key={player.id}
                            className="p-4 rounded-xl bg-black/20 border border-white/10"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-semibold text-zinc-200">
                                {player.userName}
                              </h3>
                              <div className="flex gap-2">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  type="button"
                                  onClick={() => addCharacterToPlayer(player.id)}
                                >
                                  + Add Character
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  type="button"
                                  onClick={() => removePlayerFromCampaign(player.id)}
                                >
                                  Remove Player
                                </Button>
                              </div>
                            </div>

                            {player.characters.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-zinc-500 bg-black/20 rounded-lg">
                                No characters yet
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {player.characters.map((character) => (
                                  <div
                                    key={character.id}
                                    className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-white/5"
                                  >
                                    <Input
                                      value={character.name}
                                      onChange={(e) =>
                                        updateCharacterName(
                                          player.id,
                                          character.id,
                                          e.target.value
                                        )
                                      }
                                      placeholder="Character name"
                                      className="flex-1"
                                    />
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      type="button"
                                      onClick={() =>
                                        removeCharacterFromPlayer(player.id, character.id)
                                      }
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                )}

                {activeTab === "gear" && (
                  <Card className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <h2 className="text-xl font-semibold mb-4">Starting Gear Shop</h2>
                    
                    {/* Campaign Selection Status */}
                    {!selectedId ? (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 font-medium">
                          ⚠️ Please select a campaign from the left sidebar to manage its store items.
                        </p>
                      </div>
                    ) : (
                      <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <p className="text-emerald-400 text-sm">
                          ✓ Managing store for: <span className="font-semibold">{selected?.name || 'Campaign'}</span>
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Panel: Available Items Browser */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-zinc-200">
                            Available Items
                          </h3>
                          <span className="text-sm text-zinc-400">
                            {availableItems.filter(item => {
                              const matchesType = itemTypeFilter === "all" || item.type === itemTypeFilter;
                              const matchesGenre = itemGenreFilter === "all" || 
                                (item.genreTags && item.genreTags.toLowerCase().includes(itemGenreFilter.toLowerCase()));
                              const matchesSearch = itemSearchQuery === "" || 
                                item.name.toLowerCase().includes(itemSearchQuery.toLowerCase());
                              return matchesType && matchesGenre && matchesSearch;
                            }).length} items
                          </span>
                        </div>

                        {/* Search and Filters */}
                        <div className="space-y-3">
                          <Input
                            placeholder="Search items..."
                            className="w-full"
                            value={itemSearchQuery}
                            onChange={(e) => setItemSearchQuery(e.target.value)}
                          />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <select 
                              className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-zinc-300"
                              value={itemTypeFilter}
                              onChange={(e) => setItemTypeFilter(e.target.value)}
                            >
                              <option value="all">All Types</option>
                              <option value="Weapon">Weapons</option>
                              <option value="Armor">Armor</option>
                              <option value="Item">Items</option>
                            </select>
                            
                            <select 
                              className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-zinc-300"
                              value={itemGenreFilter}
                              onChange={(e) => setItemGenreFilter(e.target.value)}
                            >
                              <option value="all">All Genres</option>
                              <option value="High Fantasy">High Fantasy</option>
                              <option value="Low Fantasy">Low Fantasy</option>
                              <option value="Dark Fantasy">Dark Fantasy</option>
                              <option value="Urban Fantasy">Urban Fantasy</option>
                              <option value="Epic Fantasy">Epic Fantasy</option>
                              <option value="Sword & Sorcery">Sword & Sorcery</option>
                              <option value="Grimdark">Grimdark</option>
                              <option value="Post-Apocalyptic">Post-Apocalyptic</option>
                              <option value="Cyberpunk">Cyberpunk</option>
                              <option value="Steampunk">Steampunk</option>
                              <option value="Dieselpunk">Dieselpunk</option>
                              <option value="Space Opera">Space Opera</option>
                              <option value="Hard Sci-Fi">Hard Sci-Fi</option>
                              <option value="Soft Sci-Fi">Soft Sci-Fi</option>
                              <option value="Horror">Horror</option>
                              <option value="Gothic Horror">Gothic Horror</option>
                              <option value="Cosmic Horror">Cosmic Horror</option>
                              <option value="Supernatural">Supernatural</option>
                              <option value="Historical">Historical</option>
                              <option value="Alternate History">Alternate History</option>
                              <option value="Modern Day">Modern Day</option>
                              <option value="Western">Western</option>
                              <option value="Noir">Noir</option>
                              <option value="Pulp Adventure">Pulp Adventure</option>
                              <option value="Superhero">Superhero</option>
                              <option value="Mystery">Mystery</option>
                              <option value="Thriller">Thriller</option>
                              <option value="Survival">Survival</option>
                              <option value="Military">Military</option>
                              <option value="Political Intrigue">Political Intrigue</option>
                            </select>
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="border border-white/10 rounded-xl bg-black/20 max-h-[600px] overflow-y-auto">
                          <div className="p-4 space-y-2">
                            {(() => {
                              const filtered = availableItems
                                .filter(item => {
                                  const matchesType = itemTypeFilter === "all" || item.type === itemTypeFilter;
                                  const matchesGenre = itemGenreFilter === "all" || 
                                    (item.genreTags && item.genreTags.toLowerCase().includes(itemGenreFilter.toLowerCase()));
                                  const matchesSearch = itemSearchQuery === "" || 
                                    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase());
                                  return matchesType && matchesGenre && matchesSearch;
                                })
                                .sort((a, b) => a.name.localeCompare(b.name));
                              
                              if (filtered.length === 0) {
                                return (
                                  <div className="flex items-center justify-center py-12 text-zinc-500">
                                    No items match your filters
                                  </div>
                                );
                              }
                              
                              return filtered.map((item) => (
                              <div
                                key={item.id}
                                className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-zinc-200">
                                        {item.name}
                                      </span>
                                      {item.rarity && (
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                          item.rarity === "common" ? "bg-zinc-600/30 text-zinc-300" :
                                          item.rarity === "uncommon" ? "bg-green-600/30 text-green-300" :
                                          item.rarity === "rare" ? "bg-blue-600/30 text-blue-300" :
                                          item.rarity === "epic" ? "bg-purple-600/30 text-purple-300" :
                                          "bg-orange-600/30 text-orange-300"
                                        }`}>
                                          {item.rarity}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-col gap-1 mt-1">
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs text-zinc-400">
                                          {item.type}
                                        </span>
                                        <span className="text-xs text-emerald-400">
                                          {item.cost} credits
                                        </span>
                                      </div>
                                      {item.genreTags && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs px-2 py-0.5 rounded bg-purple-600/20 text-purple-300">
                                            {item.genreTags.length > 30 ? item.genreTags.substring(0, 30) + '...' : item.genreTags}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="secondary"
                                    className="text-xs px-3 py-1"
                                    onClick={async () => {
                                      console.log('Add button clicked:', { 
                                        selectedId, 
                                        itemId: item.id, 
                                        itemName: item.name,
                                        campaignName: selected?.name 
                                      });
                                      
                                      if (!selectedId) {
                                        console.warn('No campaign selected');
                                        return;
                                      }
                                      if (!shopItems.find(si => si.id === item.id)) {
                                        const newItems = [...shopItems, item];
                                        setShopItems(newItems);
                                        await saveCampaignStoreItems(selectedId, [item]);
                                      }
                                    }}
                                    disabled={shopItems.some(si => si.id === item.id) || isSavingStore || !selectedId}
                                  >
                                    {shopItems.some(si => si.id === item.id) ? "Added" : isSavingStore ? "Saving..." : "Add"}
                                  </Button>
                                </div>
                              </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Right Panel: Shop Items */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-zinc-200">
                            Shop Items
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-zinc-400">
                              {shopItems.length} items
                            </span>
                            <Button
                              variant="primary"
                              className="text-xs px-4 py-2"
                              onClick={async () => {
                                if (!selectedId || shopItems.length === 0) return;
                                await saveCampaignStoreItems(selectedId, shopItems);
                              }}
                              disabled={!selectedId || shopItems.length === 0 || isSavingStore}
                            >
                              {isSavingStore ? "Saving..." : "Save All Changes"}
                            </Button>
                          </div>
                        </div>

                        <div className="border border-white/10 rounded-xl bg-black/20 min-h-[600px] max-h-[600px] overflow-y-auto p-4">
                          {shopItems.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-zinc-500">
                              Add items from the left to populate your shop
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {shopItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="p-3 rounded-lg bg-white/5 border border-white/10"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-zinc-200">
                                          {item.name}
                                        </span>
                                        {item.rarity && (
                                          <span className={`text-xs px-2 py-0.5 rounded ${
                                            item.rarity === "common" ? "bg-zinc-600/30 text-zinc-300" :
                                            item.rarity === "uncommon" ? "bg-green-600/30 text-green-300" :
                                            item.rarity === "rare" ? "bg-blue-600/30 text-blue-300" :
                                            item.rarity === "epic" ? "bg-purple-600/30 text-purple-300" :
                                            "bg-orange-600/30 text-orange-300"
                                          }`}>
                                            {item.rarity}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-col gap-1 mt-1">
                                        <div className="flex items-center gap-3">
                                          <span className="text-xs text-zinc-400">
                                            {item.type}
                                          </span>
                                          <span className="text-xs text-emerald-400">
                                            {item.cost} credits
                                          </span>
                                        </div>
                                        {item.genreTags && (
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs px-2 py-0.5 rounded bg-purple-600/20 text-purple-300">
                                              {item.genreTags.length > 30 ? item.genreTags.substring(0, 30) + '...' : item.genreTags}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      variant="secondary"
                                      className="text-xs px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300"
                                      onClick={async () => {
                                        if (!selectedId) return;
                                        if (item.storeItemId) {
                                          await removeCampaignStoreItem(selectedId, item.storeItemId);
                                        }
                                        setShopItems(shopItems.filter(si => si.id !== item.id));
                                      }}
                                      disabled={isSavingStore}
                                    >
                                      {isSavingStore ? "Removing..." : "Remove"}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {activeTab === "archetypes" && (
                  <Card className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">Archetypes</h2>
                      {selectedId && (
                        <Button
                          variant="primary"
                          onClick={() => {
                            setShowArchetypeModal(true);
                            setNewArchetype({
                              id: '',
                              name: '',
                              description: '',
                              attributes: { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
                              skills: [],
                            });
                          }}
                          disabled={isSavingArchetype}
                        >
                          {isSavingArchetype ? "Saving..." : "+ Add Archetype"}
                        </Button>
                      )}
                    </div>
                    
                    {/* Campaign Selection Status */}
                    {!selectedId ? (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 font-medium">
                          ⚠️ Please select a campaign from the left sidebar to manage its archetypes.
                        </p>
                      </div>
                    ) : (
                      <div>
                        {archetypes.length === 0 ? (
                          <div className="p-8 rounded-xl bg-black/20 border border-white/10 text-center">
                            <p className="text-zinc-500 mb-4">No archetypes created yet</p>
                            <Button
                              variant="primary"
                              onClick={() => setShowArchetypeModal(true)}
                            >
                              Create Your First Archetype
                            </Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {archetypes.map((archetype) => (
                              <div
                                key={archetype.id}
                                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col"
                              >
                                <div className="flex-1 mb-3">
                                  <h4 className="font-semibold text-zinc-200">{archetype.name}</h4>
                                  {archetype.description && (
                                    <p className="text-xs text-zinc-400 mt-1">{archetype.description}</p>
                                  )}
                                  
                                  {/* Attributes Summary */}
                                  <div className="mt-3 text-xs">
                                    <p className="text-zinc-500 mb-2">Attributes:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(archetype.attributes).map(([key, val]: [string, any]) => (
                                        <span key={key} className="px-2 py-0.5 rounded bg-purple-600/20 text-purple-300">
                                          {key.slice(0, 3).toUpperCase()} {val}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Skills Summary */}
                                  {archetype.skills.length > 0 && (
                                    <div className="mt-2 text-xs">
                                      <p className="text-zinc-500 mb-1">Skills ({archetype.skills.length}):</p>
                                      <div className="space-y-1">
                                        {archetype.skills.slice(0, 3).map((skill, idx) => (
                                          <div key={idx} className="text-zinc-400">
                                            {skill.skillName} <span className="text-emerald-400">+{skill.points}</span>
                                          </div>
                                        ))}
                                        {archetype.skills.length > 3 && (
                                          <div className="text-zinc-500">+{archetype.skills.length - 3} more...</div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-3 border-t border-white/10">
                                  <Button
                                    variant="secondary"
                                    className="text-xs px-3 py-1 flex-1"
                                    onClick={() => {
                                      setNewArchetype(archetype);
                                      setShowArchetypeModal(true);
                                    }}
                                    disabled={isSavingArchetype}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    className="text-xs px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300"
                                    onClick={() => deleteArchetype(selectedId, archetype.id)}
                                    disabled={isSavingArchetype}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )}

                {/* Archetype Modal */}
                {showArchetypeModal && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <Card className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold">
                          {newArchetype.id ? "Edit Archetype" : "Create New Archetype"}
                        </h2>
                        <button
                          onClick={() => setShowArchetypeModal(false)}
                          className="text-zinc-400 hover:text-zinc-200"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-6">
                        {/* Name and Description */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-zinc-400 mb-2 block">Archetype Name *</label>
                            <Input
                              placeholder="e.g., Warrior, Rogue, Mage"
                              value={newArchetype.name}
                              onChange={(e) => setNewArchetype({ ...newArchetype, name: e.target.value })}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-zinc-400 mb-2 block">Description</label>
                            <Input
                              placeholder="Brief description..."
                              value={newArchetype.description || ''}
                              onChange={(e) => setNewArchetype({ ...newArchetype, description: e.target.value })}
                              className="w-full"
                            />
                          </div>
                        </div>

                        {/* Point Budget Display */}
                        {selected && (
                          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                            <div>
                              <p className="text-xs text-zinc-500 mb-1">Attribute Points</p>
                              <p className="text-sm font-semibold text-zinc-200">
                                {Object.values(newArchetype.attributes || {}).reduce((a, b) => a + b, 0)} / {selected.attributePoints || 150} spent
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-500 mb-1">Skill Points</p>
                              <p className="text-sm font-semibold text-zinc-200">
                                {(newArchetype.skills || []).reduce((sum, s) => sum + s.points, 0)} / {selected.skillPoints || 50} spent
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Attributes */}
                        <div>
                          <label className="text-sm text-zinc-400 mb-3 block font-semibold">Attributes</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map((attr) => (
                              <div key={attr}>
                                <label className="text-xs text-zinc-500 mb-2 block capitalize">{attr}</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={newArchetype.attributes[attr] || 0}
                                    onChange={(e) => setNewArchetype({
                                      ...newArchetype,
                                      attributes: { ...newArchetype.attributes, [attr]: parseInt(e.target.value) }
                                    })}
                                    className="flex-1"
                                  />
                                  <span className="text-sm font-semibold text-zinc-300 w-8 text-right">
                                    {newArchetype.attributes[attr] || 0}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Skills - Organized by Attribute (Same as Character Builder) */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <label className="text-sm text-zinc-400 block font-semibold">Select Tier 1 Skills</label>
                            <span className="text-xs text-zinc-500">{newArchetype.skills.length} selected</span>
                          </div>

                          {allSkills.length === 0 ? (
                            <p className="text-sm text-zinc-500">Loading skills...</p>
                          ) : (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              {/* Group skills by attribute - matching character builder logic */}
                              {['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'].map((attr) => {
                                const attrShort = attr.substring(0, 3).toUpperCase();
                                const skillsByAttr = allSkills.filter(s => {
                                  const primary = s.primaryAttribute?.toUpperCase();
                                  const secondary = s.secondaryAttribute?.toUpperCase();
                                  return primary === attrShort || secondary === attrShort;
                                });
                                
                                if (skillsByAttr.length === 0) return null;
                                
                                return (
                                  <div key={attr} className="border-l-2 border-white/20 pl-4">
                                    <h4 className="text-xs font-semibold text-zinc-300 mb-2">{attr}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {skillsByAttr.map((skill) => {
                                        const selected = newArchetype.skills.find(s => s.skillId === skill.id);
                                        return (
                                          <div
                                            key={skill.id}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                              selected
                                                ? 'bg-emerald-600/30 border-emerald-500/50'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                            }`}
                                            onClick={() => {
                                              if (selected) {
                                                setNewArchetype({
                                                  ...newArchetype,
                                                  skills: newArchetype.skills.filter(s => s.skillId !== skill.id)
                                                });
                                              } else {
                                                setNewArchetype({
                                                  ...newArchetype,
                                                  skills: [...newArchetype.skills, { skillId: skill.id, skillName: skill.name, points: 0 }]
                                                });
                                              }
                                            }}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="text-sm font-medium text-zinc-200">{skill.name}</span>
                                              {selected && (
                                                <span className="text-xs font-semibold text-emerald-300">✓</span>
                                              )}
                                            </div>
                                            {selected && (
                                              <div className="mt-2 flex items-center gap-2">
                                                <label className="text-xs text-zinc-400">Points:</label>
                                                <input
                                                  type="number"
                                                  value={selected.points}
                                                  onChange={(e) => setNewArchetype({
                                                    ...newArchetype,
                                                    skills: newArchetype.skills.map(s =>
                                                      s.skillId === skill.id ? { ...s, points: Math.max(0, Math.min(10, parseInt(e.target.value) || 0)) } : s
                                                    )
                                                  })}
                                                  onClick={(e) => e.stopPropagation()}
                                                  min="0"
                                                  max="10"
                                                  className="w-12 px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-zinc-300"
                                                />
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Special Abilities Section */}
                              {(() => {
                                const specialAbilities = allSkills.filter(s => s.type === 'special ability');
                                if (specialAbilities.length === 0) return null;
                                
                                return (
                                  <div key="special" className="border-l-2 border-white/20 pl-4">
                                    <h4 className="text-xs font-semibold text-zinc-300 mb-2">Special Abilities</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {specialAbilities.map((skill) => {
                                        const selected = newArchetype.skills.find(s => s.skillId === skill.id);
                                        return (
                                          <div
                                            key={skill.id}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                              selected
                                                ? 'bg-emerald-600/30 border-emerald-500/50'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                            }`}
                                            onClick={() => {
                                              if (selected) {
                                                setNewArchetype({
                                                  ...newArchetype,
                                                  skills: newArchetype.skills.filter(s => s.skillId !== skill.id)
                                                });
                                              } else {
                                                setNewArchetype({
                                                  ...newArchetype,
                                                  skills: [...newArchetype.skills, { skillId: skill.id, skillName: skill.name, points: 0 }]
                                                });
                                              }
                                            }}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="text-sm font-medium text-zinc-200">{skill.name}</span>
                                              {selected && (
                                                <span className="text-xs font-semibold text-emerald-300">✓</span>
                                              )}
                                            </div>
                                            {selected && (
                                              <div className="mt-2 flex items-center gap-2">
                                                <label className="text-xs text-zinc-400">Points:</label>
                                                <input
                                                  type="number"
                                                  value={selected.points}
                                                  onChange={(e) => setNewArchetype({
                                                    ...newArchetype,
                                                    skills: newArchetype.skills.map(s =>
                                                      s.skillId === skill.id ? { ...s, points: Math.max(0, Math.min(10, parseInt(e.target.value) || 0)) } : s
                                                    )
                                                  })}
                                                  onClick={(e) => e.stopPropagation()}
                                                  min="0"
                                                  max="10"
                                                  className="w-12 px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-zinc-300"
                                                />
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Tier 2/3 Magic Guidance */}
                        <div className="border-t border-white/10 pt-6">
                          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Tier 2/3 Magic Skill Guidance</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-zinc-400 mb-2 block">Spellcraft Guidance</label>
                              <textarea
                                placeholder="e.g., Fire and Healing spheres for tier 2, Fireball and Cure Wounds for tier 3..."
                                value={newArchetype.spellcraftGuidance || ''}
                                onChange={(e) => setNewArchetype({ ...newArchetype, spellcraftGuidance: e.target.value })}
                                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 min-h-[80px]"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-zinc-400 mb-2 block">Talismanism Guidance</label>
                              <textarea
                                placeholder="e.g., Divine Focus and Protection focus for tier 2..."
                                value={newArchetype.talismanismGuidance || ''}
                                onChange={(e) => setNewArchetype({ ...newArchetype, talismanismGuidance: e.target.value })}
                                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 min-h-[80px]"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-zinc-400 mb-2 block">Faith Guidance</label>
                              <textarea
                                placeholder="e.g., Light and Healing domains for tier 2..."
                                value={newArchetype.faithGuidance || ''}
                                onChange={(e) => setNewArchetype({ ...newArchetype, faithGuidance: e.target.value })}
                                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 min-h-[80px]"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-zinc-400 mb-2 block">Psionics Guidance</label>
                              <textarea
                                placeholder="e.g., Combat Psionics and Healing disciplines for tier 2..."
                                value={newArchetype.psonicsGuidance || ''}
                                onChange={(e) => setNewArchetype({ ...newArchetype, psonicsGuidance: e.target.value })}
                                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 min-h-[80px]"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-zinc-400 mb-2 block">Bardic Resonance Guidance</label>
                              <textarea
                                placeholder="e.g., Combat and Healing resonance types for tier 2..."
                                value={newArchetype.bardicGuidance || ''}
                                onChange={(e) => setNewArchetype({ ...newArchetype, bardicGuidance: e.target.value })}
                                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 min-h-[80px]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-white/10">
                          <Button
                            variant="primary"
                            onClick={() => {
                              if (newArchetype.name.trim() && selectedId) {
                                saveArchetype(selectedId, newArchetype);
                              }
                            }}
                            disabled={!newArchetype.name.trim() || isSavingArchetype}
                            className="flex-1"
                          >
                            {isSavingArchetype ? "Saving..." : "Save Archetype"}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setShowArchetypeModal(false);
                              setNewArchetype({
                                id: '',
                                name: '',
                                description: '',
                                attributes: { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
                                skills: [],
                                spellcraftGuidance: '',
                                talismanismGuidance: '',
                                faithGuidance: '',
                                psonicsGuidance: '',
                                bardicGuidance: '',
                              });
                            }}
                            disabled={isSavingArchetype}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {activeTab === "preview" && (
                  <Card className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <h2 className="text-xl font-semibold mb-6">Campaign Preview</h2>
                    
                    <div className="space-y-6">
                      {/* Campaign Overview */}
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-200 mb-3">
                          Campaign Overview
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                            <p className="text-xs text-zinc-500 mb-1">Campaign Name</p>
                            <p className="text-zinc-200 font-medium">{selected.name}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                            <p className="text-xs text-zinc-500 mb-1">Genre</p>
                            <p className="text-zinc-200 font-medium">
                              {selected.genre || "Not specified"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Character Configuration */}
                      <div className="pt-4 border-t border-white/10">
                        <h3 className="text-lg font-semibold text-zinc-200 mb-3">
                          Character Configuration
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                            <p className="text-xs text-zinc-500 mb-1">Attribute Points</p>
                            <p className="text-zinc-200 font-medium text-lg">
                              {selected.attributePoints}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                            <p className="text-xs text-zinc-500 mb-1">Skill Points</p>
                            <p className="text-zinc-200 font-medium text-lg">
                              {selected.skillPoints}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                            <p className="text-xs text-zinc-500 mb-1">Max Points in Any Skill</p>
                            <p className="text-zinc-200 font-medium text-lg">
                              {selected.maxPointsInSkill ?? "Unlimited"}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                            <p className="text-xs text-zinc-500 mb-1">Points for Next Tier</p>
                            <p className="text-zinc-200 font-medium text-lg">
                              {selected.pointsNeededForNextTier ?? "Not set"}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                            <p className="text-xs text-zinc-500 mb-1">Max Allowed in Tier</p>
                            <p className="text-zinc-200 font-medium text-lg">
                              {selected.maxAllowedInTier ?? "Unlimited"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Enabled Systems */}
                      <div className="pt-4 border-t border-white/10">
                        <h3 className="text-lg font-semibold text-zinc-200 mb-3">
                          Enabled Systems & Tiers
                        </h3>
                        <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                          <div className="flex flex-wrap gap-2">
                            {selected.tier1Enabled && (
                              <span className="px-3 py-1 rounded-full bg-amber-400/10 text-amber-200 text-sm border border-amber-400/20">
                                Tier 1
                              </span>
                            )}
                            {selected.tier2Enabled && (
                              <span className="px-3 py-1 rounded-full bg-amber-400/10 text-amber-200 text-sm border border-amber-400/20">
                                Tier 2
                              </span>
                            )}
                            {selected.tier3Enabled && (
                              <span className="px-3 py-1 rounded-full bg-amber-400/10 text-amber-200 text-sm border border-amber-400/20">
                                Tier 3
                              </span>
                            )}
                            {selected.spellcraftEnabled && (
                              <span className="px-3 py-1 rounded-full bg-purple-400/10 text-purple-200 text-sm border border-purple-400/20">
                                Spellcraft
                              </span>
                            )}
                            {selected.talismanismEnabled && (
                              <span className="px-3 py-1 rounded-full bg-purple-400/10 text-purple-200 text-sm border border-purple-400/20">
                                Talismanism
                              </span>
                            )}
                            {selected.faithEnabled && (
                              <span className="px-3 py-1 rounded-full bg-purple-400/10 text-purple-200 text-sm border border-purple-400/20">
                                Faith
                              </span>
                            )}
                            {selected.psyonicsEnabled && (
                              <span className="px-3 py-1 rounded-full bg-purple-400/10 text-purple-200 text-sm border border-purple-400/20">
                                Psyonics
                              </span>
                            )}
                            {selected.bardicResonancesEnabled && (
                              <span className="px-3 py-1 rounded-full bg-purple-400/10 text-purple-200 text-sm border border-purple-400/20">
                                Bardic Resonances
                              </span>
                            )}
                            {selected.specialAbilitiesEnabled && (
                              <span className="px-3 py-1 rounded-full bg-purple-400/10 text-purple-200 text-sm border border-purple-400/20">
                                Special Abilities
                              </span>
                            )}
                            {!selected.tier1Enabled &&
                              !selected.tier2Enabled &&
                              !selected.tier3Enabled &&
                              !selected.spellcraftEnabled &&
                              !selected.talismanismEnabled &&
                              !selected.faithEnabled &&
                              !selected.psyonicsEnabled &&
                              !selected.bardicResonancesEnabled &&
                              !selected.specialAbilitiesEnabled && (
                                <span className="text-zinc-500 text-sm">No systems enabled</span>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Currency System */}
                      <div className="pt-4 border-t border-white/10">
                        <h3 className="text-lg font-semibold text-zinc-200 mb-3">
                          Currency System
                        </h3>
                        {selected.currencies.length === 0 ? (
                          <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                            <p className="text-zinc-500 text-sm">No currencies defined</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {selected.currencies.map((currency) => (
                              <div
                                key={currency.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/10"
                              >
                                <span className="text-zinc-200 font-medium">
                                  {currency.name || "Unnamed Currency"}
                                  {currency.symbol && (
                                    <span className="ml-2 text-amber-400 font-mono text-sm">({currency.symbol})</span>
                                  )}
                                </span>
                                <span className="text-zinc-400 text-sm">
                                  {currency.creditValue} credit{currency.creditValue !== 1 ? "s" : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Players & Characters */}
                      <div className="pt-4 border-t border-white/10">
                        <h3 className="text-lg font-semibold text-zinc-200 mb-3">
                          Players & Characters
                        </h3>
                        {(selected.players || []).length === 0 ? (
                          <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                            <p className="text-zinc-500 text-sm">No players added yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {(selected.players || []).map((player) => (
                              <div
                                key={player.id}
                                className="p-4 rounded-xl bg-black/20 border border-white/10"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-zinc-200 font-semibold">
                                    {player.userName}
                                  </h4>
                                  <span className="text-xs text-zinc-500">
                                    {player.characters.length} character{player.characters.length !== 1 ? "s" : ""}
                                  </span>
                                </div>
                                {player.characters.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {player.characters.map((character) => (
                                      <span
                                        key={character.id}
                                        className="px-3 py-1 rounded-full bg-blue-400/10 text-blue-200 text-sm border border-blue-400/20"
                                      >
                                        {character.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Allowed Races */}
                      <div className="pt-4 border-t border-white/10">
                        <h3 className="text-lg font-semibold text-zinc-200 mb-3">
                          Allowed Races
                        </h3>
                        {(selected.allowedRaces || []).length === 0 ? (
                          <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                            <p className="text-zinc-500 text-sm">No races selected (all available races allowed)</p>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                            <div className="flex flex-wrap gap-2">
                              {(selected.allowedRaces || []).map((raceId) => {
                                const race = availableRaces.find((r) => r.id === raceId);
                                return race ? (
                                  <span
                                    key={raceId}
                                    className="px-3 py-1 rounded-full bg-green-400/10 text-green-200 text-sm border border-green-400/20"
                                  >
                                    {race.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Summary Stats */}
                      <div className="pt-4 border-t border-white/10">
                        <h3 className="text-lg font-semibold text-zinc-200 mb-3">
                          Campaign Summary
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-400/10 to-amber-600/10 border border-amber-400/20">
                            <p className="text-xs text-amber-200 mb-1">Total Players</p>
                            <p className="text-2xl font-bold text-amber-100">
                              {(selected.players || []).length}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-400/10 to-blue-600/10 border border-blue-400/20">
                            <p className="text-xs text-blue-200 mb-1">Total Characters</p>
                            <p className="text-2xl font-bold text-blue-100">
                              {(selected.players || []).reduce(
                                (sum, p) => sum + p.characters.length,
                                0
                              )}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-400/10 to-purple-600/10 border border-purple-400/20">
                            <p className="text-xs text-purple-200 mb-1">Systems Enabled</p>
                            <p className="text-2xl font-bold text-purple-100">
                              {[
                                selected.tier1Enabled,
                                selected.tier2Enabled,
                                selected.tier3Enabled,
                                selected.spellcraftEnabled,
                                selected.talismanismEnabled,
                                selected.faithEnabled,
                                selected.psyonicsEnabled,
                                selected.bardicResonancesEnabled,
                                selected.specialAbilitiesEnabled,
                              ].filter(Boolean).length}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-gradient-to-br from-green-400/10 to-green-600/10 border border-green-400/20">
                            <p className="text-xs text-green-200 mb-1">Allowed Races</p>
                            <p className="text-2xl font-bold text-green-100">
                              {(selected.allowedRaces || []).length || "All"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {activeTab === "rewards" && (
                  <Card className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <h2 className="text-xl font-semibold mb-4">Assign EXP & Quin</h2>
                    <p className="text-zinc-400">Reward assignment content goes here...</p>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
