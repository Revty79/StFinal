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
  const [loading, setLoading] = useState(true);

  // Fetch campaigns on mount
  useEffect(() => {
    fetchCampaigns();
    fetchActiveUsers();
  }, []);

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
    if (selectedId && selected && !selected.players) {
      fetchCampaignDetails(selectedId);
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
              <Tabs
                tabs={tabs}
                activeId={activeTab}
                onChange={setActiveTab}
              />

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
                          {selected.currencies.map((currency, idx) => (
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
                                  placeholder="e.g., Gold Coin"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                  Credit Value
                                </label>
                                <Input
                                  type="number"
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
                                  placeholder="e.g., 1.0"
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
                                creditValue: 1,
                              };
                              updateCampaign({
                                currencies: [...selected.currencies, newCurrency],
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
                          Select which races are allowed in this campaign.
                        </p>
                        <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                          <p className="text-sm text-zinc-500">
                            Race selection interface will be implemented here.
                          </p>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="pt-4 border-t border-white/10 flex justify-end">
                        <Button
                          variant="primary"
                          size="md"
                          type="button"
                          onClick={() => {
                            // Save functionality will be implemented later
                            console.log("Save campaign:", selected);
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
                                  !selected.players.some((p) => p.userId === user.id)
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
                              (user) => !selected.players.some((p) => p.userId === user.id)
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
                      {selected.players.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 border border-dashed border-white/10 rounded-xl">
                          No players added yet. Click "+ Add Player" to add players to this campaign.
                        </div>
                      ) : (
                        selected.players.map((player) => (
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
                        {selected.players.length === 0 ? (
                          <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                            <p className="text-zinc-500 text-sm">No players added yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selected.players.map((player) => (
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

                      {/* Summary Stats */}
                      <div className="pt-4 border-t border-white/10">
                        <h3 className="text-lg font-semibold text-zinc-200 mb-3">
                          Campaign Summary
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-400/10 to-amber-600/10 border border-amber-400/20">
                            <p className="text-xs text-amber-200 mb-1">Total Players</p>
                            <p className="text-2xl font-bold text-amber-100">
                              {selected.players.length}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-400/10 to-blue-600/10 border border-blue-400/20">
                            <p className="text-xs text-blue-200 mb-1">Total Characters</p>
                            <p className="text-2xl font-bold text-blue-100">
                              {selected.players.reduce(
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
                            <p className="text-xs text-green-200 mb-1">Currencies</p>
                            <p className="text-2xl font-bold text-green-100">
                              {selected.currencies.length}
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
