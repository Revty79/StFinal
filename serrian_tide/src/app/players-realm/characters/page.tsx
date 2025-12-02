'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { GradientText } from "@/components/GradientText";

type Campaign = {
  id: string;
  name: string;
  genre: string | null;
  campaignPlayerId: string; // The player's ID in this campaign
};

type Character = {
  id: string;
  name: string;
  campaignPlayerId: string; // Links to the campaignPlayer entry
  isSetupComplete?: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function CharactersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [qtext, setQtext] = useState("");

  // Load campaigns user is playing in
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch campaigns where user is a player
        const campaignsResponse = await fetch('/api/campaigns/player');
        if (!campaignsResponse.ok) throw new Error('Failed to fetch campaigns');
        const campaignsData = await campaignsResponse.json();
        
        if (campaignsData.ok && Array.isArray(campaignsData.campaigns)) {
          // Map campaigns to our type with campaignPlayerId
          const mappedCampaigns: Campaign[] = campaignsData.campaigns.map((c: any) => ({
            id: c.id,
            name: c.name,
            genre: c.genre,
            campaignPlayerId: c.campaignPlayerId, // This is the user's player ID in this campaign
          }));
          setCampaigns(mappedCampaigns);

          // Fetch characters for each campaign
          const allCharacters: Character[] = [];
          
          for (const campaign of mappedCampaigns) {
            try {
              // Fetch characters for this player in this campaign
              const charactersResponse = await fetch(`/api/campaigns/${campaign.id}/characters`);
              if (!charactersResponse.ok) continue;
              
              const charactersData = await charactersResponse.json();
              if (charactersData.ok && Array.isArray(charactersData.characters)) {
                // Filter characters that belong to this player
                const playerCharacters = charactersData.characters.filter(
                  (char: any) => char.campaignPlayerId === campaign.campaignPlayerId
                );
                
                for (const char of playerCharacters) {
                  allCharacters.push({
                    id: char.id,
                    name: char.name,
                    campaignPlayerId: char.campaignPlayerId,
                    isSetupComplete: char.isSetupComplete ?? false,
                    createdAt: char.createdAt,
                    updatedAt: char.updatedAt,
                  });
                }
              }
            } catch (err) {
              console.error(`Error fetching characters for campaign ${campaign.id}:`, err);
            }
          }
          
          setCharacters(allCharacters);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter characters for selected campaign
  const campaignCharacters = useMemo(() => {
    if (!selectedCampaignId) return [];
    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
    if (!selectedCampaign) return [];
    // Filter characters by the campaignPlayerId for this campaign
    return characters.filter(c => c.campaignPlayerId === selectedCampaign.campaignPlayerId);
  }, [characters, selectedCampaignId, campaigns]);

  const filteredCharacters = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    if (!q) return campaignCharacters;
    return campaignCharacters.filter(c => c.name.toLowerCase().includes(q));
  }, [campaignCharacters, qtext]);

  const selectedCharacter = useMemo(
    () => characters.find(c => c.id === selectedCharacterId) ?? null,
    [characters, selectedCharacterId]
  );

  async function createCharacter() {
    if (!selectedCampaignId) {
      alert("Please select a campaign first.");
      return;
    }
    
    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
    if (!selectedCampaign) {
      alert("Campaign not found.");
      return;
    }
    
    try {
      // Create a character in the database using the campaignPlayerId
      const response = await fetch(`/api/campaigns/${selectedCampaignId}/characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignPlayerId: selectedCampaign.campaignPlayerId,
          name: 'New Character',
          isSetupComplete: false,
        }),
      });

      if (!response.ok) throw new Error('Failed to create character');
      
      const data = await response.json();
      if (data.ok && data.character) {
        // Navigate to builder with the new character ID and campaign ID
        router.push(`/players-realm/characters/builder?campaignId=${selectedCampaignId}&characterId=${data.character.id}`);
      }
    } catch (error) {
      console.error("Error creating character:", error);
      alert("Failed to create character. Please try again.");
    }
  }

  function openCharacterSheet() {
    if (!selectedCharacterId || !selectedCampaignId) return;
    
    // For now, always go to builder until we create the sheet page
    // TODO: Once character sheet page is built, route completed characters there
    router.push(`/players-realm/characters/builder?campaignId=${selectedCampaignId}&characterId=${selectedCharacterId}`);
  }

  if (loading) {
    return (
      <main className="min-h-screen px-3 sm:px-4 py-6 sm:py-8 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-3 sm:px-4 py-6 sm:py-8">
      <header className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <GradientText
              as="h1"
              variant="title"
              glow
              className="font-evanescent text-2xl sm:text-3xl md:text-4xl tracking-tight"
            >
              My Characters
            </GradientText>
            <p className="text-xs sm:text-sm text-zinc-300/90 max-w-2xl">
              Select a campaign, then create or manage your characters.
              Build your heroes and track their journey through epic adventures.
            </p>
          </div>
          <Link href="/players-realm">
            <Button variant="secondary" size="sm">
              ← Back to Players' Realm
            </Button>
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[340px,1fr] gap-4 sm:gap-6 mt-4 sm:mt-6">
        {/* LEFT: Campaign & Character Selection */}
        <div className="space-y-4">
          {/* Campaign Selector */}
          <Card
            padded={false}
            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl"
          >
            <h2 className="text-sm font-semibold text-zinc-200 mb-3">
              Select Campaign
            </h2>

            {campaigns.length === 0 ? (
              <div className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4 text-center">
                <p className="text-sm text-amber-200 mb-2">No Campaigns Yet</p>
                <p className="text-xs text-zinc-400">
                  You're not in any campaigns. Ask your GM to add you to a campaign.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    onClick={() => setSelectedCampaignId(campaign.id)}
                    className={`w-full text-left rounded-xl border p-3 transition ${
                      selectedCampaignId === campaign.id
                        ? "border-violet-400/40 bg-violet-400/10"
                        : "border-white/10 bg-black/20 hover:bg-white/5"
                    }`}
                  >
                    <p className="text-sm font-medium text-zinc-100">
                      {campaign.name}
                    </p>
                    {campaign.genre && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {campaign.genre}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Character List */}
          {selectedCampaignId && (
            <Card
              padded={false}
              className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl"
            >
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-zinc-200">
                  Characters
                </h2>
              </div>

              <div className="space-y-2 mb-3">
                <Input
                  value={qtext}
                  onChange={(e) => setQtext(e.target.value)}
                  placeholder="Search characters..."
                />
              </div>

              <div className="max-h-[300px] overflow-auto mobile-scroll-container">
                {filteredCharacters.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                    <p className="text-xs text-zinc-400">
                      {qtext ? "No matching characters" : "No characters yet. Create your first hero!"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCharacters.map((character) => (
                      <button
                        key={character.id}
                        onClick={() => setSelectedCharacterId(character.id)}
                        className={`w-full text-left rounded-xl border p-3 transition ${
                          selectedCharacterId === character.id
                            ? "border-emerald-400/40 bg-emerald-400/10"
                            : "border-white/10 bg-black/20 hover:bg-white/5"
                        }`}
                      >
                        <p className="text-sm font-medium text-zinc-100">
                          {character.name}
                        </p>
                        {!character.isSetupComplete && (
                          <p className="text-xs text-amber-300 mt-0.5">
                            ⚠️ Setup Incomplete
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT: Character Details / Preview */}
        <Card
          padded={false}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-2xl"
        >
          {!selectedCampaignId ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-violet-400/20">
                <svg
                  className="h-8 w-8 text-violet-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <p className="text-sm text-zinc-300 mb-2">Select a Campaign</p>
              <p className="text-xs text-zinc-400 max-w-sm">
                Choose a campaign from the left to view and manage your characters for that adventure.
              </p>
            </div>
          ) : !selectedCharacterId ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-400/20">
                <svg
                  className="h-8 w-8 text-emerald-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <p className="text-sm text-zinc-300 mb-2">
                {filteredCharacters.length === 0 ? "Create Your First Character" : "Select a Character"}
              </p>
              <p className="text-xs text-zinc-400 max-w-sm mb-4">
                {filteredCharacters.length === 0 
                  ? "Click the '+ New' button to create your first character for this campaign."
                  : "Choose a character from the left to view details and manage their progress."}
              </p>
              {filteredCharacters.length === 0 && (
                <Button variant="primary" onClick={createCharacter}>
                  Create Character
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-100">
                    {selectedCharacter?.name}
                  </h2>
                  {!selectedCharacter?.isSetupComplete && (
                    <p className="text-sm text-amber-300 mt-1">
                      ⚠️ Character setup is incomplete
                    </p>
                  )}
                </div>
                <Button
                  variant="primary"
                  onClick={openCharacterSheet}
                >
                  {selectedCharacter?.isSetupComplete ? "Manage Character" : "Continue Setup"}
                </Button>
              </div>

              <Card className="rounded-2xl border border-blue-300/30 bg-blue-300/5 p-4">
                <p className="text-xs text-zinc-300">
                  {selectedCharacter?.isSetupComplete ? (
                    <>
                      <span className="font-semibold text-blue-200">Ready to Play:</span> This character
                      is complete and ready for adventures. Use the Manage Character button to spend
                      experience points, update equipment, and track progress.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-amber-200">Setup Required:</span> Complete
                      your character's initial setup by allocating attributes, skills, and filling out
                      their backstory. Once complete, you'll be ready to join sessions!
                    </>
                  )}
                </p>
              </Card>

              {/* TODO: Add character preview/summary here */}
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-zinc-400 text-center">
                  Character details coming soon...
                </p>
              </div>
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
