"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { GradientText } from "@/components/GradientText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { Input } from "@/components/Input";
import { Tabs } from "@/components/Tabs";

/* ---------- types & helpers ---------- */

type CharacterTabKey = "identity" | "attributes" | "skills" | "story" | "equipment" | "preview";

export type Character = {
  id: string | number;
  
  // Identity tab fields
  playerName?: string | null;
  characterName: string;
  campaignName?: string | null;
  race?: string | null;
  age?: number | null;
  baseMagic?: number | null; // Populated from race
  baseMovement?: number | null; // Populated from race
  sex?: string | null;
  height?: number | null;
  weight?: number | null;
  skinColor?: string | null;
  eyeColor?: string | null;
  hairColor?: string | null;
  deity?: string | null;
  fame?: number | null; // Locked, GM assigned
  experience?: number | null; // In-game
  totalExperience?: number | null; // In-game
  quintessence?: number | null; // In-game
  totalQuintessence?: number | null; // In-game
  definingMarks?: string | null; // Large text field

  // Stats (mirrors your core attributes)
  strength?: number | null;
  dexterity?: number | null;
  constitution?: number | null;
  intelligence?: number | null;
  wisdom?: number | null;
  charisma?: number | null;
  hp_total?: number | null;
  initiative?: number | null;
  mana?: number | null;
  armor_soak?: string | null;
  defense_notes?: string | null; // AC, resistances, notes
  base_movement?: number | null; // Racial attribute for initiative calculation

  // Controls & Allocations
  challenge_rating?: number | null; // CR for encounter balancing
  skill_allocations?: Record<string, number> | null; // skill_id -> points (current state)
  skill_checkpoint?: Record<string, number> | null; // skill_id -> points (last saved state)
  is_initial_setup_locked?: boolean; // True once initial 50 skill points are saved
  xp_spent?: number | null; // Total XP spent on skills after initial allocation
  xp_checkpoint?: number | null; // XP spent at last checkpoint

  // Story / personality
  personality?: string | null; // quick read on vibe
  ideals?: string | null;
  bonds?: string | null;
  flaws?: string | null;
  goals?: string | null;
  secrets?: string | null;
  backstory?: string | null;
  motivations?: string | null;
  hooks?: string | null; // how to pull PCs into scenes

  // Connections & power
  faction?: string | null;
  relationships?: string | null; // who they care about
  attitude_toward_party?: string | null;
  allies?: string | null;
  enemies?: string | null;
  affiliations?: string | null;
  resources?: string | null; // money, troops, contacts, gear

  notes?: string | null;
};

const CHARACTER_TABS: { id: CharacterTabKey; label: string }[] = [
  { id: "identity", label: "Identity" },
  { id: "attributes", label: "Attributes" },
  { id: "skills", label: "Skills & Abilities" },
  { id: "story", label: "Story & Personality" },
  { id: "equipment", label: "Purchase Equipment" },
  { id: "preview", label: "Preview" },
];

const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------- main page ---------- */

export default function CharacterBuilderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-zinc-400">Loading...</p></div>}>
      <CharacterBuilderContent />
    </Suspense>
  );
}

function CharacterBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const characterId = searchParams.get('characterId');

  // Campaign data from database
  const [campaign, setCampaign] = useState<any>(null);
  const [campaignLoading, setCampaignLoading] = useState(true);

  // Escape -> back to characters page
  useEffect(() => {
    const onKey = (e: any) => {
      if (e.key === "Escape") {
        router.push("/players-realm/characters");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  // library data
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CharacterTabKey>("identity");
  const [skillSubTab, setSkillSubTab] = useState<"strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma" | "special">("strength");
  const [qtext, setQtext] = useState("");
  const [loading, setLoading] = useState(true);
  const [races, setRaces] = useState<Array<{ 
    id: number; 
    name: string; 
    baseMovement?: number;
  }>>([]);
  const [allSkills, setAllSkills] = useState<Array<{ 
    id: string; 
    name: string; 
    primaryAttribute: string;
    secondaryAttribute: string;
    tier: number | null;
    parentId: string | null;
    parent2Id: string | null;
    parent3Id: string | null;
    type: string;
  }>>([]);

  // Load campaign data from API
  useEffect(() => {
    async function loadCampaignData() {
      if (!campaignId) {
        console.error("No campaign ID provided");
        setCampaignLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/campaigns/${campaignId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch campaign");
        }
        const data = await response.json();
        if (data.ok && data.campaign) {
          setCampaign(data.campaign);
        }
      } catch (error) {
        console.error("Error loading campaign:", error);
      } finally {
        setCampaignLoading(false);
      }
    }

    loadCampaignData();
  }, [campaignId]);

  // Load races from API
  useEffect(() => {
    async function loadRaces() {
      try {
        const response = await fetch('/api/worldbuilder/races');
        if (!response.ok) return;
        const data = await response.json();
        if (data.ok && Array.isArray(data.races)) {
          setRaces(data.races.map((r: any) => ({
            id: r.id,
            name: r.name,
            baseMovement: r.baseMovement,
            maxStrength: r.maxStrength,
            maxDexterity: r.maxDexterity,
            maxConstitution: r.maxConstitution,
            maxIntelligence: r.maxIntelligence,
            maxWisdom: r.maxWisdom,
            maxCharisma: r.maxCharisma,
          })));
        }
      } catch (error) {
        console.error("Error loading races:", error);
      }
    }
    loadRaces();
  }, []);

  // Load skills from API
  useEffect(() => {
    async function loadSkills() {
      try {
        const response = await fetch('/api/worldbuilder/skills');
        if (!response.ok) return;
        const data = await response.json();
        if (data.ok && Array.isArray(data.skills)) {
          setAllSkills(data.skills.map((s: any) => ({
            id: s.id,
            name: s.name,
            primaryAttribute: s.primaryAttribute,
            secondaryAttribute: s.secondaryAttribute,
            tier: s.tier,
            parentId: s.parentId,
            parent2Id: s.parent2Id,
            parent3Id: s.parent3Id,
            type: s.type,
          })));
        }
      } catch (error) {
        console.error("Error loading skills:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSkills();
  }, []);

  // Initialize character when campaign loads
  useEffect(() => {
    if (campaign && !loading && characters.length === 0) {
      // Create initial character for this campaign
      const newChar: Character = {
        id: characterId || `char-${Date.now()}`,
        characterName: "New Character",
        playerName: null,
        campaignName: campaign.name,
        race: null,
        age: null,
        baseMagic: null,
        baseMovement: null,
        sex: null,
        height: null,
        weight: null,
        skinColor: null,
        eyeColor: null,
        hairColor: null,
        deity: null,
        fame: 0,
        experience: 0,
        totalExperience: 0,
        quintessence: 0,
        totalQuintessence: 0,
        definingMarks: null,
        strength: 25,
        dexterity: 25,
        constitution: 25,
        intelligence: 25,
        wisdom: 25,
        charisma: 25,
        hp_total: null,
        initiative: null,
        skill_allocations: {},
        skill_checkpoint: {},
        is_initial_setup_locked: false,
        backstory: null,
        personality: null,
        motivations: null,
        goals: null,
        secrets: null,
        relationships: null,
      };
      setCharacters([newChar]);
      setSelectedId(String(newChar.id));
    }
  }, [campaign, loading, characters.length, characterId]);

  const selected: Character | null = useMemo(
    () =>
      characters.find((c) => String(c.id) === String(selectedId ?? "")) ?? null,
    [characters, selectedId]
  );

  // Ensure something is selected once we have data
  useEffect(() => {
    if (!selected && characters.length) {
      const first = characters[0];
      if (first) setSelectedId(String(first.id));
    }
  }, [characters, selected]);

  const filteredList = useMemo(() => {
    const q = qtext.trim().toLowerCase();
    if (!q) return characters;
    return characters.filter((c) => {
      const base = [
        c.characterName,
        c.playerName ?? "",
        c.campaignName ?? "",
        c.race ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return base.includes(q);
    });
  }, [characters, qtext]);

  /* ---------- CRUD helpers ---------- */

  // Save characters to localStorage
  function saveToLocalStorage(chars: Character[]) {
    localStorage.setItem('serrian_characters', JSON.stringify(chars));
  }

  function createCharacter() {
    const id = uid();
    const row: Character = {
      id,
      playerName: null,
      characterName: "New Character",
      campaignName: null,
      race: null,
      age: null,
      baseMagic: null,
      baseMovement: null,
      sex: null,
      height: null,
      weight: null,
      skinColor: null,
      eyeColor: null,
      hairColor: null,
      deity: null,
      fame: 0,
      experience: 0,
      totalExperience: 0,
      quintessence: 0,
      totalQuintessence: 0,
      definingMarks: null,
      strength: 25,
      dexterity: 25,
      constitution: 25,
      intelligence: 25,
      wisdom: 25,
      charisma: 25,
      hp_total: null,
      initiative: null,
      mana: null,
      armor_soak: null,
      defense_notes: null,
      base_movement: 5, // Default base movement
      challenge_rating: 1,
      skill_allocations: {},
      personality: null,
      ideals: null,
      bonds: null,
      flaws: null,
      goals: null,
      secrets: null,
      backstory: null,
      hooks: null,
      faction: null,
      relationships: null,
      attitude_toward_party: null,
      resources: null,
      notes: null,
    };
    const newChars = [row, ...characters];
    setCharacters(newChars);
    saveToLocalStorage(newChars);
    setSelectedId(String(id));
    setActiveTab("identity");
  }

  function updateSelected(patch: Partial<Character>) {
    if (!selected) return;
    const idStr = String(selected.id);
    const updated = characters.map((c) =>
      String(c.id) === idStr
        ? {
            ...c,
            ...patch,
          }
        : c
    );
    setCharacters(updated);
    saveToLocalStorage(updated);
  }

  function saveSelected() {
    if (!selected) return;
    // Data is already saved via updateSelected
    alert("Character saved to localStorage!");
  }

  function deleteSelected() {
    if (!selected) return;

    const idStr = String(selected.id);

    if (!confirm("Delete this character?")) return;

    const updated = characters.filter((c) => String(c.id) !== idStr);
    setCharacters(updated);
    saveToLocalStorage(updated);
    setSelectedId(null);
  }

  /* ---------- Point Allocation Systems ---------- */

  // Filter races based on campaign's allowedRaces
  const availableRaces = useMemo(() => {
    if (!campaign?.allowedRaces || campaign.allowedRaces.length === 0) {
      return races; // If no restrictions, show all races
    }
    // Filter to only races that are in the campaign's allowed list
    return races.filter(r => campaign.allowedRaces.includes(String(r.id)));
  }, [races, campaign?.allowedRaces]);

  // Get max attributes for selected race
  const selectedRaceData = useMemo(() => {
    if (!selected?.race) return null;
    return races.find(r => r.name === selected.race) || null;
  }, [selected?.race, races]);

  // Get point budgets from campaign settings
  const attributePointBudget = campaign?.attributePoints ?? 150;
  const skillPointBudget = campaign?.skillPoints ?? 50;

  // Calculate total attribute points spent (each attribute starts at 25, budget comes from campaign)
  const calculateAttributePointsSpent = useMemo(() => {
    if (!selected) return 0;
    const str = selected.strength ?? 25;
    const dex = selected.dexterity ?? 25;
    const con = selected.constitution ?? 25;
    const int = selected.intelligence ?? 25;
    const wis = selected.wisdom ?? 25;
    const cha = selected.charisma ?? 25;
    return str + dex + con + int + wis + cha;
  }, [selected?.strength, selected?.dexterity, selected?.constitution, selected?.intelligence, selected?.wisdom, selected?.charisma]);

  const attributePointsRemaining = attributePointBudget - calculateAttributePointsSpent;

  // Calculate total skill points spent (budget comes from campaign)
  const calculateSkillPointsSpent = useMemo(() => {
    if (!selected?.skill_allocations) return 0;
    return Object.values(selected.skill_allocations).reduce((sum, points) => sum + points, 0);
  }, [selected?.skill_allocations]);

  const skillPointsRemaining = skillPointBudget - calculateSkillPointsSpent;
  const isInitialSkillPointsSpent = calculateSkillPointsSpent >= skillPointBudget;

  // Calculate points spent in each tier for unlock logic
  const tierPointsSpent = useMemo(() => {
    if (!selected?.skill_allocations) return { tier1: 0, tier2: 0 };
    
    const allocations = selected.skill_allocations;
    let tier1Total = 0;
    let tier2Total = 0;
    
    // Sum points by tier
    Object.entries(allocations).forEach(([skillId, points]) => {
      const skill = allSkills.find(s => s.id === skillId);
      if (skill) {
        if (skill.tier === 1) {
          tier1Total += points;
        } else if (skill.tier === 2) {
          tier2Total += points;
        }
      }
    });
    
    return { tier1: tier1Total, tier2: tier2Total };
  }, [selected?.skill_allocations, allSkills]);

  // Helper to check if a skill is unlocked based on tier rules
  const isSkillUnlocked = useMemo(() => (skill: any): boolean => {
    if (!selected) return false;
    
    // Tier 1 skills are always unlocked
    if (skill.tier === 1) return true;
    
    // Special abilities with no tier are always unlocked
    if (skill.tier === null || skill.tier === undefined) return true;
    
    const allocations = selected.skill_allocations || {};
    const pointsNeeded = campaign?.pointsNeededForNextTier ?? 25;
    
    // Tier 2/3 require at least one parent skill to have enough points
    // Check all possible parent fields
    const parentIds = [skill.parentId, skill.parent2Id, skill.parent3Id].filter(Boolean);
    
    for (const parentId of parentIds) {
      if (parentId) {
        const parentSkill = allSkills.find(s => s.id === parentId);
        if (parentSkill) {
          // Find the actual allocation key (might be contexted like "grandparentId:parentId")
          let parentPoints = 0;
          
          if (parentSkill.tier === 1) {
            // Tier 1 skills use simple key
            parentPoints = allocations[parentId] ?? 0;
          } else if (parentSkill.tier === 2) {
            // Tier 2 skills might be contexted with tier 1 grandparent
            // Look for key like "tier1Id:tier2Id"
            const contextedKey = Object.keys(allocations).find(key => {
              if (key.includes(':')) {
                const parts = key.split(':');
                return parts[parts.length - 1] === parentId;
              }
              return key === parentId;
            });
            parentPoints = allocations[contextedKey || parentId] ?? 0;
          } else {
            // Try both simple and any contexted key
            parentPoints = allocations[parentId] ?? 0;
            if (parentPoints === 0) {
              const contextedKey = Object.keys(allocations).find(key => key.includes(parentId));
              if (contextedKey) {
                parentPoints = allocations[contextedKey] ?? 0;
              }
            }
          }
          
          // For tier 2 skills
          if (skill.tier === 2) {
            // Check if parent is "magic access" type - if so, only need 1 point
            if (parentSkill.type === "magic access") {
              if (parentPoints >= 1) return true;
            } else {
              // Standard skills: need pointsNeededForNextTier
              if (parentPoints >= pointsNeeded) return true;
            }
          }
          
          // For tier 3 skills
          if (skill.tier === 3) {
            // Check if parent is sphere, discipline, or resonance type
            const magicTier2Types = ['sphere', 'discipline', 'resonance'];
            const parentType = parentSkill.type?.toLowerCase() || '';
            
            if (magicTier2Types.includes(parentType)) {
              // Magic tier 3: need 1+ point in tier 2 parent
              // AND 1+ point in at least one tier 1 grandparent
              console.log(`[T3 Magic] "${skill.name}" checking parent "${parentSkill.name}" (${parentType}), has ${parentPoints} points`);
              
              if (parentPoints >= 1) {
                // Check tier 1 grandparents
                const grandparentIds = [parentSkill.parentId, parentSkill.parent2Id, parentSkill.parent3Id].filter(Boolean);
                console.log(`  Grandparent IDs:`, grandparentIds);
                
                for (const grandparentId of grandparentIds) {
                  if (grandparentId) {
                    const grandparentPoints = allocations[grandparentId] ?? 0;
                    const grandparent = allSkills.find(s => s.id === grandparentId);
                    console.log(`    Checking grandparent "${grandparent?.name}": ${grandparentPoints} points`);
                    
                    if (grandparentPoints >= 1) {
                      console.log(`    ✓ UNLOCKED! Has 1+ in tier 1 AND tier 2`);
                      return true; // Found valid grandparent with 1+ points
                    }
                  }
                }
                console.log(`  ✗ Has tier 2 points but no tier 1 grandparent with 1+ points`);
              } else {
                console.log(`  ✗ Parent only has ${parentPoints} points, needs 1+`);
              }
            } else {
              // Standard tier 3: need pointsNeededForNextTier in tier 2 parent
              console.log(`[T3 Standard] "${skill.name}" checking parent "${parentSkill.name}", has ${parentPoints} points (needs ${pointsNeeded})`);
              
              if (parentPoints >= pointsNeeded) {
                console.log(`  ✓ UNLOCKED!`);
                return true;
              } else {
                console.log(`  ✗ Not enough points`);
              }
            }
          }
        }
      }
    }
    
    return false;
  }, [selected, selected?.skill_allocations, allSkills, campaign?.pointsNeededForNextTier]);

  // Calculate cost to increase a skill by 1 point
  const calculateSkillCost = (currentPoints: number, isUsingInitialPoints: boolean): number => {
    if (isUsingInitialPoints) {
      // Initial 50 points: 1-to-1 cost
      return 1;
    } else {
      // XP spending: cost equals current points in skill
      // E.g., going from 5 to 6 costs 5 XP
      return currentPoints;
    }
  };

  // Calculate skill rank (points + attribute mod)
  // For tier 1: rank = points + attribute mod
  // For tier 2: rank = parent tier 1 rank + points in tier 2 skill
  // For tier 3: rank = parent tier 2 rank + points in tier 3 skill
  const calculateSkillRank = (skillPoints: number, attributeName: string, skillId?: string, tier?: number | null, contextParentId?: string): number => {
    if (!selected) return skillPoints;
    
    // Handle NA or empty for special abilities - no attribute modifier
    const attrUpper = attributeName?.toUpperCase();
    if (!attrUpper || attrUpper === 'NA' || attrUpper === 'N/A') {
      return skillPoints; // Special abilities: rank = points only
    }
    
    // For tier 2 and tier 3 skills, we need to add parent skill rank (not recalculate attribute)
    if (tier && tier > 1 && skillId) {
      const skill = allSkills.find(s => s.id === skillId);
      if (skill) {
        // contextParentId can be:
        // - For tier 2: just the tier 1 parent ID (e.g., "parentId")
        // - For tier 3: the full tier 2 context (e.g., "tier1Id:tier2Id")
        let parentId: string | undefined;
        let grandparentContext: string | undefined;
        
        if (contextParentId && contextParentId.includes(':')) {
          // Tier 3 skill: contextParentId is "tier1Id:tier2Id"
          const parts = contextParentId.split(':');
          parentId = parts[parts.length - 1]; // Last part is the tier 2 parent ID
          grandparentContext = parts.slice(0, -1).join(':'); // Everything before is grandparent context (tier 1)
        } else {
          // Tier 2 skill or tier 3 without full context: use provided context or fall back
          parentId = contextParentId || skill.parentId || skill.parent2Id || skill.parent3Id;
        }
        
        if (parentId) {
          const parentSkill = allSkills.find(s => s.id === parentId);
          if (parentSkill) {
            // Determine the correct allocation key for the parent
            let parentAllocationKey: string;
            
            if (parentSkill.tier === 1) {
              // Parent is tier 1, use simple key
              parentAllocationKey = parentId;
            } else if (parentSkill.tier === 2) {
              // Parent is tier 2, we should have grandparent context from tier 3
              if (grandparentContext) {
                // We have the tier 1 context, construct the tier 2 key
                parentAllocationKey = `${grandparentContext}:${parentId}`;
              } else {
                // Fallback: look through allocations to find the contexted key
                const allocations = selected.skill_allocations || {};
                const contextedKey = Object.keys(allocations).find(key => {
                  if (key.includes(':')) {
                    const parts = key.split(':');
                    return parts[parts.length - 1] === parentId;
                  }
                  return false;
                });
                parentAllocationKey = contextedKey || parentId;
              }
            } else {
              // Shouldn't happen, but fallback to simple key
              parentAllocationKey = parentId;
            }
            
            const parentPoints = selected.skill_allocations?.[parentAllocationKey] ?? 0;
            // Recursively calculate parent rank
            // For tier 2 parent, pass grandparent context so it can find its tier 1 parent
            const parentRank = calculateSkillRank(parentPoints, parentSkill.primaryAttribute || "", parentId, parentSkill.tier, grandparentContext);
            // Tier 2/3 rank = parent rank + points spent in this skill (no additional attribute mod)
            return parentRank + skillPoints;
          }
        }
      }
    }
    
    // Tier 1: standard calculation (points + attribute mod)
    let attributeValue = 25; // default
    
    // Support both full names and 3-letter codes
    const normalizedAttr = attributeName.toLowerCase();
    if (normalizedAttr === 'str' || normalizedAttr === 'strength') {
      attributeValue = selected.strength ?? 25;
    } else if (normalizedAttr === 'dex' || normalizedAttr === 'dexterity') {
      attributeValue = selected.dexterity ?? 25;
    } else if (normalizedAttr === 'con' || normalizedAttr === 'constitution') {
      attributeValue = selected.constitution ?? 25;
    } else if (normalizedAttr === 'int' || normalizedAttr === 'intelligence') {
      attributeValue = selected.intelligence ?? 25;
    } else if (normalizedAttr === 'wis' || normalizedAttr === 'wisdom') {
      attributeValue = selected.wisdom ?? 25;
    } else if (normalizedAttr === 'cha' || normalizedAttr === 'charisma') {
      attributeValue = selected.charisma ?? 25;
    }
    
    const attributeMod = calculateMod(attributeValue);
    return skillPoints + attributeMod;
  };

  // Calculate skill percentage (100 - (rank + attribute))
  // For tier 1: % = 100 - (rank + attribute)
  // For tier 2: % = 100 - (rank + attribute) where rank includes parent
  // For tier 3: % = 100 - (rank + attribute) where rank includes tier 2 parent
  const calculateSkillPercent = (skillPoints: number, attributeName: string, skillId?: string, tier?: number | null, contextParentId?: string): number => {
    if (!selected) return 100;
    
    // Handle NA or empty for special abilities - simply 100 - points
    const attrUpper = attributeName?.toUpperCase();
    if (!attrUpper || attrUpper === 'NA' || attrUpper === 'N/A') {
      return 100 - skillPoints; // Special abilities: % = 100 - points only
    }
    
    let attributeValue = 25; // default
    
    // Support both full names and 3-letter codes
    const normalizedAttr = attributeName.toLowerCase();
    if (normalizedAttr === 'str' || normalizedAttr === 'strength') {
      attributeValue = selected.strength ?? 25;
    } else if (normalizedAttr === 'dex' || normalizedAttr === 'dexterity') {
      attributeValue = selected.dexterity ?? 25;
    } else if (normalizedAttr === 'con' || normalizedAttr === 'constitution') {
      attributeValue = selected.constitution ?? 25;
    } else if (normalizedAttr === 'int' || normalizedAttr === 'intelligence') {
      attributeValue = selected.intelligence ?? 25;
    } else if (normalizedAttr === 'wis' || normalizedAttr === 'wisdom') {
      attributeValue = selected.wisdom ?? 25;
    } else if (normalizedAttr === 'cha' || normalizedAttr === 'charisma') {
      attributeValue = selected.charisma ?? 25;
    }
    
    // If no points spent, skill is untrained - return 100%
    if (skillPoints === 0) return 100;
    
    const rank = calculateSkillRank(skillPoints, attributeName, skillId, tier, contextParentId);
    return 100 - (rank + attributeValue);
  };

  // CR to XP lookup table for skill experience
  const CR_TO_XP: Record<number, number> = {
    1: 0, 2: 25, 3: 50, 4: 75, 5: 125, 6: 200, 7: 325, 8: 525, 9: 850, 10: 1020,
    11: 1224, 12: 1469, 13: 1763, 14: 2116, 15: 2540, 16: 3048, 17: 3658, 18: 4390, 19: 5268, 20: 6322,
    21: 7587, 22: 9105, 23: 10926, 24: 13112, 25: 15735, 26: 18882, 27: 22659, 28: 27191, 29: 32630, 30: 39156,
    31: 45812, 32: 53501, 33: 62696, 34: 73355, 35: 85826, 36: 100423, 37: 117517, 38: 137495, 39: 160869, 40: 188217,
    41: 220214, 42: 257650, 43: 301450, 44: 352696, 45: 412654, 46: 482805, 47: 564882, 48: 660912, 49: 773267, 50: 904722,
  };

  // Calculate available XP based on CR (only after initial 50 skill points are spent)
  const availableXP = useMemo(() => {
    if (!selected?.challenge_rating) return 0;
    const cr = selected.challenge_rating;
    // Only show XP if initial setup is locked
    if (!selected.is_initial_setup_locked) return 0;
    return CR_TO_XP[cr] || 0;
  }, [selected?.challenge_rating, selected?.is_initial_setup_locked]);

  const xpSpent = selected?.xp_spent ?? 0;
  const xpRemaining = selected?.is_initial_setup_locked ? availableXP - xpSpent : 0;

  // Helper to generate allocation key
  // For tier 1 skills: use skillId
  // For tier 2/3 skills with multiple parents: use "parentId:skillId" to track points per tree
  function getAllocationKey(skillId: string, parentId?: string): string {
    return parentId ? `${parentId}:${skillId}` : skillId;
  }

  // Helper to update skill allocation
  function updateSkillAllocation(skillId: string, newPoints: number, parentId?: string) {
    if (!selected) return;
    
    const allocationKey = getAllocationKey(skillId, parentId);
    const currentAllocations = selected.skill_allocations || {};
    const currentPoints = currentAllocations[allocationKey] ?? 0;
    const checkpoint = selected.skill_checkpoint || {};
    const checkpointValue = checkpoint[allocationKey] ?? 0;
    const currentXPSpent = selected.xp_spent ?? 0;
    
    // If initial setup is NOT locked, use initial point spending rules
    if (!selected.is_initial_setup_locked) {
      // Cap at 10 for tier 1 skills during initial allocation
      if (newPoints > 10) {
        return;
      }
      
      // If removing points
      if (newPoints <= 0) {
        const updatedAllocations = { ...currentAllocations };
        delete updatedAllocations[allocationKey];
        updateSelected({ skill_allocations: updatedAllocations });
        return;
      }
      
      // If adding points, check budget
      if (newPoints > currentPoints) {
        const pointDifference = newPoints - currentPoints;
        if (skillPointsRemaining < pointDifference) {
          return; // Not enough points remaining
        }
      }
      
      const updatedAllocations = { ...currentAllocations };
      updatedAllocations[allocationKey] = newPoints;
      updateSelected({ skill_allocations: updatedAllocations });
      return;
    }
    
    // XP SPENDING MODE (initial setup is locked)
    
    // DECREASE: Can decrease but not below checkpoint
    if (newPoints < currentPoints) {
      if (newPoints < checkpointValue) {
        alert(`Cannot reduce below last saved checkpoint (${checkpointValue} points). Create a new checkpoint first if you want to permanently reduce this skill.`);
        return;
      }
      
      // Calculate XP refund
      let xpRefund = 0;
      for (let i = newPoints; i < currentPoints; i++) {
        if (i === 0) {
          xpRefund += 10; // New skill cost
        } else {
          xpRefund += i; // Upgrade cost
        }
      }
      
      const updatedAllocations = { ...currentAllocations };
      if (newPoints <= 0) {
        delete updatedAllocations[allocationKey];
      } else {
        updatedAllocations[allocationKey] = newPoints;
      }

      updateSelected({ 
        skill_allocations: updatedAllocations,
        xp_spent: Math.max(0, currentXPSpent - xpRefund)
      });
      return;
    }
    
    // INCREASE: Can only increase by 1 at a time with XP
    if (newPoints !== currentPoints + 1) {
      return; // Only allow +1 increases
    }
    
    // Calculate XP cost
    let xpCost = 0;
    if (currentPoints === 0) {
      // New skill: costs 10 XP (with exception for some races - future enhancement)
      xpCost = 10;
    } else {
      // Upgrading existing skill: cost equals current points in skill
      xpCost = currentPoints;
    }
    
    // Check if enough XP remaining
    if (xpRemaining < xpCost) {
      alert(`Not enough XP. This upgrade costs ${xpCost} XP, but you only have ${xpRemaining} XP remaining.`);
      return;
    }
    
    // Apply the upgrade
    const updatedAllocations = { ...currentAllocations };
    updatedAllocations[allocationKey] = newPoints;
    updateSelected({ 
      skill_allocations: updatedAllocations,
      xp_spent: currentXPSpent + xpCost
    });
  }

  // Function to lock initial setup and enable XP spending
  function lockInitialSetup() {
    if (!selected) return;
    if (calculateSkillPointsSpent !== 50) {
      alert('You must spend exactly 50 skill points before locking initial setup.');
      return;
    }
    
    // Create checkpoint of current skill allocations
    const checkpoint = { ...(selected.skill_allocations || {}) };
    
    updateSelected({ 
      is_initial_setup_locked: true,
      skill_checkpoint: checkpoint,
      xp_spent: 0,
      xp_checkpoint: 0
    });
  }

  // Function to create a new checkpoint (save current state)
  function createCheckpoint() {
    if (!selected || !selected.is_initial_setup_locked) return;
    
    const checkpoint = { ...(selected.skill_allocations || {}) };
    const xpCheckpoint = selected.xp_spent ?? 0;
    
    updateSelected({
      skill_checkpoint: checkpoint,
      xp_checkpoint: xpCheckpoint
    });
    
    alert('Checkpoint created! Skills saved at current state.');
  }

  /* ---------- preview text ---------- */

  // Calculate modifier from attribute score
  const calculateMod = (attrValue: number | null): number => {
    if (attrValue === null || attrValue === undefined) return -5;
    if (attrValue < 1) return -5;
    
    // Clear progression based on ranges:
    if (attrValue === 1) return -5;           // 1: -5
    if (attrValue >= 2 && attrValue <= 5) return -4;   // 2-5: -4
    if (attrValue >= 6 && attrValue <= 10) return -3;  // 6-10: -3
    if (attrValue >= 11 && attrValue <= 15) return -2; // 11-15: -2
    if (attrValue >= 16 && attrValue <= 20) return -1; // 16-20: -1
    if (attrValue >= 21 && attrValue <= 29) return 0;  // 21-29: 0
    
    // 30+: starts at +1 and increases by +1 every 5 points
    // 30-34: +1, 35-39: +2, 40-44: +3, 45-49: +4, etc.
    if (attrValue >= 30) {
      return Math.floor((attrValue - 30) / 5) + 1;
    }
    
    return -5; // fallback
  };

  // Calculate percentage from attribute score
  const calculatePercent = (attrValue: number | null): number => {
    if (attrValue === null || attrValue === undefined) return 100;
    return 100 - attrValue;
  };

  // Calculate HP total from constitution
  const calculateHP = (constitution: number | null): number => {
    if (constitution === null || constitution === undefined) return 0;
    const baseHP = constitution * 2;
    const conMod = calculateMod(constitution);
    return baseHP + conMod;
  };

  // Calculate Base Initiative from Dexterity (Serrian Tide rules)
  // Start with 1 at DEX 1, gain +1 at DEX 5, then +1 for every 5 points
  const calculateBaseInitiative = (dexterity: number | null): number => {
    if (dexterity === null || dexterity === undefined || dexterity < 1) return 1;
    if (dexterity < 5) return 1;
    // At DEX 5+, add 1 for every 5 points
    return 1 + Math.floor(dexterity / 5);
  };

  // Calculate Total Initiative
  const calculateInitiative = (dexterity: number | null, baseMovement: number | null): number => {
    const baseInit = calculateBaseInitiative(dexterity);
    const movement = baseMovement ?? 5; // Default to 5 if not set
    return baseInit * movement;
  };

  // Derive location HP from total HP using predefined percentages
  const locationHP = useMemo(() => {
    const total = selected?.hp_total ?? 0;
    const segments = [
      ["head", 0.1],
      ["chest", 0.3],
      ["leftArm", 0.15],
      ["rightArm", 0.15],
      ["leftLeg", 0.15],
      ["rightLeg", 0.15],
    ] as const;

    let allocated = 0;
    const baseValues = segments.reduce((acc, [key, pct]) => {
      const value = Math.floor(total * pct);
      allocated += value;
      acc[key] = value;
      return acc;
    }, {} as Record<(typeof segments)[number][0], number>);

    const remainder = total - allocated;
    return {
      ...baseValues,
      chest: baseValues.chest + remainder, // Assign any rounding difference to chest so sums match total
    };
  }, [selected?.hp_total]);

  // Auto-calculate derived stats when attributes change
  useEffect(() => {
    if (!selected) return;
    
    const newHP = calculateHP(selected.constitution ?? null);
    const newInitiative = calculateInitiative(selected.dexterity ?? null, selected.base_movement ?? null);
    
    // Only update if values changed to avoid infinite loops
    if (selected.hp_total !== newHP || selected.initiative !== newInitiative) {
      updateSelected({
        hp_total: newHP,
        initiative: newInitiative,
      });
    }
  }, [selected?.strength, selected?.dexterity, selected?.constitution, 
      selected?.intelligence, selected?.wisdom, selected?.charisma, 
      selected?.base_movement]);

  const previewText = useMemo(() => {
    if (!selected) return "";
    const n = selected;
    const nvLocal = (x: unknown) =>
      x === null || x === undefined || x === "" ? "—" : String(x);

    return [
      `Character: ${n.characterName}`,
      `Player: ${nvLocal(n.playerName)}`,
      `Campaign: ${nvLocal(n.campaignName)}`,
      `Race: ${nvLocal(n.race)} | Age: ${nvLocal(n.age)} | Sex: ${nvLocal(n.sex)}`,
      ``,
      "— Physical Description —",
      `Height: ${nvLocal(n.height)}" | Weight: ${nvLocal(n.weight)} lbs`,
      `Skin: ${nvLocal(n.skinColor)} | Eyes: ${nvLocal(n.eyeColor)} | Hair: ${nvLocal(n.hairColor)}`,
      ``,
      "— Racial Attributes —",
      `Base Magic: ${nvLocal(n.baseMagic)}`,
      `Base Movement: ${nvLocal(n.baseMovement)}`,
      ``,
      "— Spiritual & Social —",
      `Deity: ${nvLocal(n.deity)}`,
      `Fame: ${nvLocal(n.fame)}`,
      ``,
      "— Experience & Quintessence —",
      `Experience: ${nvLocal(n.experience)} / Total: ${nvLocal(n.totalExperience)}`,
      `Quintessence: ${nvLocal(n.quintessence)} / Total: ${nvLocal(n.totalQuintessence)}`,
      ``,
      "— Defining Marks & Quirks —",
      nvLocal(n.definingMarks),
    ].join("\n");
  }, [selected]);

  /* ---------- render ---------- */

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
              Character Builder
            </GradientText>
            <p className="text-xs sm:text-sm text-zinc-300/90 max-w-2xl">
              {campaign ? (
                <>Creating character for <span className="text-violet-400 font-semibold">{campaign.name}</span> campaign</>
              ) : (
                "Loading campaign information..."
              )}
            </p>
          </div>
          <Link href="/players-realm/characters">
            <Button variant="secondary" size="sm">
              ← Back to Characters
            </Button>
          </Link>
        </div>
      </header>

      {campaignLoading ? (
        <div className="max-w-7xl mx-auto mt-12 text-center">
          <p className="text-zinc-400">Loading campaign data...</p>
        </div>
      ) : !campaign ? (
        <div className="max-w-7xl mx-auto mt-12 text-center">
          <p className="text-red-400">Campaign not found or access denied.</p>
          <Link href="/players-realm/characters" className="mt-4 inline-block">
            <Button variant="secondary">Return to Characters</Button>
          </Link>
        </div>
      ) : (
        <section className="max-w-5xl mx-auto mt-4 sm:mt-6">
          {/* Campaign Info Card */}
          <Card className="mb-6 p-4 border border-violet-500/20 bg-violet-500/5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-violet-400">Campaign Settings</h3>
                <div className="text-xs text-zinc-400 space-y-0.5">
                  <p><span className="text-zinc-500">Attribute Points:</span> {attributePointBudget}</p>
                  <p><span className="text-zinc-500">Skill Points:</span> {skillPointBudget}</p>
                  <p><span className="text-zinc-500">Allowed Races:</span> {campaign.allowedRaces?.length > 0 ? `${campaign.allowedRaces.length} selected` : 'All races'}</p>
                </div>
              </div>
              <div className="text-xs text-zinc-500">
                {campaign.genre && <span className="px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700">{campaign.genre}</span>}
              </div>
            </div>
          </Card>

          {/* RIGHT: Active form */}
          <Card
            padded={false}
            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 sm:p-8 shadow-2xl"
          >
            {loading ? (
              <p className="text-sm text-zinc-400">
                Loading skills and races...
              </p>
            ) : !selected ? (
              <p className="text-sm text-zinc-400">
                Creating new character...
              </p>
            ) : (
              <>
                <div className="mb-4 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex-1">
                    <Input
                      value={selected.characterName}
                      onChange={(e) =>
                      updateSelected({ characterName: e.target.value })
                    }
                    placeholder="Character name"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">
                    This is your character&apos;s name.
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  <Tabs
                    tabs={CHARACTER_TABS}
                    activeId={activeTab}
                    onChange={(id) =>
                      setActiveTab(id as CharacterTabKey)
                    }
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={deleteSelected}
                    >
                      Delete
                    </Button>
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
                {/* IDENTITY TAB */}
                {activeTab === "identity" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Player Name"
                        htmlFor="char-player-name"
                      >
                        <Input
                          id="char-player-name"
                          value={selected.playerName ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              playerName: e.target.value,
                            })
                          }
                          placeholder="Your name"
                        />
                      </FormField>

                      <FormField
                        label="Campaign Name"
                        htmlFor="char-campaign-name"
                      >
                        <Input
                          id="char-campaign-name"
                          value={selected.campaignName ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              campaignName: e.target.value,
                            })
                          }
                          placeholder="Campaign name"
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        label="Race"
                        htmlFor="char-race"
                        description={campaign?.allowedRaces?.length > 0 ? "Campaign-restricted races" : "All available races"}
                      >
                        <select
                          id="char-race"
                          value={selected.race ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              race: e.target.value,
                              baseMagic: availableRaces.find(r => r.name === e.target.value)?.baseMovement ?? null,
                              baseMovement: availableRaces.find(r => r.name === e.target.value)?.baseMovement ?? null,
                            })
                          }
                          className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        >
                          <option value="">Select a race...</option>
                          {availableRaces.map((race) => (
                            <option key={race.id} value={race.name}>
                              {race.name}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField
                        label="Age"
                        htmlFor="char-age"
                      >
                        <Input
                          id="char-age"
                          type="number"
                          value={selected.age ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              age: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          placeholder="Age"
                        />
                      </FormField>

                      <FormField
                        label="Sex"
                        htmlFor="char-sex"
                      >
                        <Input
                          id="char-sex"
                          value={selected.sex ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              sex: e.target.value,
                            })
                          }
                          placeholder="Male, Female, etc."
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Base Magic"
                        htmlFor="char-base-magic"
                        description="Auto-populated from race"
                      >
                        <Input
                          id="char-base-magic"
                          type="number"
                          value={selected.baseMagic ?? ""}
                          readOnly
                          disabled
                          className="bg-zinc-800/50 cursor-not-allowed"
                          placeholder="Will populate from race"
                        />
                      </FormField>

                      <FormField
                        label="Base Movement"
                        htmlFor="char-base-movement"
                        description="Auto-populated from race"
                      >
                        <Input
                          id="char-base-movement"
                          type="number"
                          value={selected.baseMovement ?? ""}
                          readOnly
                          disabled
                          className="bg-zinc-800/50 cursor-not-allowed"
                          placeholder="Will populate from race"
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        label="Height"
                        htmlFor="char-height"
                        description="In inches"
                      >
                        <Input
                          id="char-height"
                          type="number"
                          value={selected.height ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              height: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          placeholder="Height (inches)"
                        />
                      </FormField>

                      <FormField
                        label="Weight"
                        htmlFor="char-weight"
                        description="In pounds"
                      >
                        <Input
                          id="char-weight"
                          type="number"
                          value={selected.weight ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              weight: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          placeholder="Weight (lbs)"
                        />
                      </FormField>

                      <FormField
                        label="Deity"
                        htmlFor="char-deity"
                        description="May become dropdown later"
                      >
                        <Input
                          id="char-deity"
                          value={selected.deity ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              deity: e.target.value,
                            })
                          }
                          placeholder="Deity"
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        label="Skin Color"
                        htmlFor="char-skin-color"
                      >
                        <Input
                          id="char-skin-color"
                          value={selected.skinColor ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              skinColor: e.target.value,
                            })
                          }
                          placeholder="Skin color"
                        />
                      </FormField>

                      <FormField
                        label="Eye Color"
                        htmlFor="char-eye-color"
                      >
                        <Input
                          id="char-eye-color"
                          value={selected.eyeColor ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              eyeColor: e.target.value,
                            })
                          }
                          placeholder="Eye color"
                        />
                      </FormField>

                      <FormField
                        label="Hair Color"
                        htmlFor="char-hair-color"
                      >
                        <Input
                          id="char-hair-color"
                          value={selected.hairColor ?? ""}
                          onChange={(e) =>
                            updateSelected({
                              hairColor: e.target.value,
                            })
                          }
                          placeholder="Hair color"
                        />
                      </FormField>
                    </div>

                    <Card className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4">
                      <p className="text-sm font-semibold text-amber-200 mb-3">In-Game Values (Locked)</p>
                      <p className="text-xs text-zinc-400 mb-3">
                        These values will be assigned or earned during gameplay.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <FormField label="Fame" htmlFor="char-fame">
                          <Input
                            id="char-fame"
                            type="number"
                            value={selected.fame ?? 0}
                            readOnly
                            disabled
                            className="bg-zinc-800/50 cursor-not-allowed"
                          />
                        </FormField>

                        <FormField label="Experience" htmlFor="char-experience">
                          <Input
                            id="char-experience"
                            type="number"
                            value={selected.experience ?? 0}
                            readOnly
                            disabled
                            className="bg-zinc-800/50 cursor-not-allowed"
                          />
                        </FormField>

                        <FormField label="Total XP" htmlFor="char-total-xp">
                          <Input
                            id="char-total-xp"
                            type="number"
                            value={selected.totalExperience ?? 0}
                            readOnly
                            disabled
                            className="bg-zinc-800/50 cursor-not-allowed"
                          />
                        </FormField>

                        <FormField label="Quintessence" htmlFor="char-quintessence">
                          <Input
                            id="char-quintessence"
                            type="number"
                            value={selected.quintessence ?? 0}
                            readOnly
                            disabled
                            className="bg-zinc-800/50 cursor-not-allowed"
                          />
                        </FormField>

                        <FormField label="Total Quintessence" htmlFor="char-total-quintessence">
                          <Input
                            id="char-total-quintessence"
                            type="number"
                            value={selected.totalQuintessence ?? 0}
                            readOnly
                            disabled
                            className="bg-zinc-800/50 cursor-not-allowed"
                          />
                        </FormField>
                      </div>
                    </Card>

                    <FormField
                      label="Defining Marks & Character Quirks"
                      htmlFor="char-defining-marks"
                      description="Describe your character's physical appearance, notable features, mannerisms, and unique traits"
                    >
                      <textarea
                        id="char-defining-marks"
                        value={selected.definingMarks ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            definingMarks: e.target.value,
                          })
                        }
                        className="w-full min-h-[160px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        placeholder="Describe your character's appearance, scars, tattoos, mannerisms, quirks, and other defining characteristics..."
                      />
                    </FormField>
                  </div>
                )}

                {/* ATTRIBUTES TAB */}
                {activeTab === "attributes" && (
                  <div className="space-y-4">
                    <Card className="rounded-2xl border border-blue-300/30 bg-blue-300/5 p-4">
                      <p className="text-xs text-zinc-300">
                        <span className="font-semibold text-blue-200">Auto-Calculated:</span> Modifiers (Mod) and 
                        Percentages (%) are automatically calculated from attribute scores. HP and Initiative update 
                        based on Constitution and Dexterity.
                      </p>
                    </Card>

                    {!selectedRaceData && (
                      <Card className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4">
                        <p className="text-xs text-amber-200">
                          <span className="font-semibold">⚠️ No Race Selected:</span> Select a race in the Identity tab 
                          to enforce max attribute limits and enable proper initiative calculations.
                        </p>
                      </Card>
                    )}

                    <Card className={[
                      "rounded-2xl border p-4",
                      attributePointsRemaining < 0 
                        ? "border-red-400/40 bg-red-400/10" 
                        : "border-violet-400/30 bg-violet-400/5"
                    ].join(" ")}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-zinc-200">Attribute Point Budget</p>
                          <p className="text-xs text-zinc-400 mt-0.5">Each attribute starts at 25 • Total budget: {attributePointBudget} points</p>
                        </div>
                        <div className="text-right">
                          <p className={[
                            "text-2xl font-bold",
                            attributePointsRemaining < 0 ? "text-red-300" : "text-violet-200"
                          ].join(" ")}>
                            {attributePointsRemaining}
                          </p>
                          <p className="text-xs text-zinc-400">remaining</p>
                        </div>
                      </div>
                      {attributePointsRemaining < 0 && (
                        <p className="text-xs text-red-300 mt-2">
                          ⚠️ Over budget! Reduce attributes to continue.
                        </p>
                      )}
                    </Card>

                    <div className="space-y-3">
                      <p className="text-sm font-medium text-zinc-200">Core Attributes</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(
                          [
                            ["STR", "strength", "Strength"],
                            ["DEX", "dexterity", "Dexterity"],
                            ["CON", "constitution", "Constitution"],
                            ["INT", "intelligence", "Intelligence"],
                            ["WIS", "wisdom", "Wisdom"],
                            ["CHA", "charisma", "Charisma"],
                          ] as const
                        ).map(([label, key, fullName]) => {
                          const attrValue = (selected as any)[key] ?? 0;
                          const mod = calculateMod(attrValue);
                          const percent = calculatePercent(attrValue);
                          const modSign = mod >= 0 ? '+' : '';
                          
                          // Get max value for this attribute from selected race
                          const maxKey = `max${fullName}` as keyof typeof selectedRaceData;
                          const maxValue = selectedRaceData?.[maxKey] as number | undefined || 50;
                          const isOverMax = attrValue > maxValue;
                          
                          return (
                            <Card key={key} className={[
                              "rounded-xl border p-3",
                              isOverMax ? "border-red-400/40 bg-red-400/10" : "border-white/10 bg-black/20"
                            ].join(" ")}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-violet-200">{label}</span>
                                <span className="text-[10px] text-zinc-400">{fullName}</span>
                              </div>
                              {selectedRaceData && (
                                <p className="text-[9px] text-zinc-500 mb-1">Max: {maxValue}</p>
                              )}
                              <FormField label="#" htmlFor={`char-${key}`}>
                                <Input
                                  id={`char-${key}`}
                                  type="number"
                                  min="0"
                                  max={maxValue}
                                  value={attrValue || 25}
                                  onChange={(e) => {
                                    const newValue = e.target.value === "" ? 25 : Number(e.target.value);
                                    const currentValue = attrValue || 25;
                                    const pointDifference = newValue - currentValue;
                                    
                                    // Check if we have enough points remaining
                                    if (pointDifference > 0 && attributePointsRemaining < pointDifference) {
                                      // Not enough points, only allow up to remaining budget
                                      const allowedValue = currentValue + attributePointsRemaining;
                                      const cappedValue = Math.min(allowedValue, maxValue);
                                      updateSelected({
                                        [key]: cappedValue,
                                      } as any);
                                      return;
                                    }
                                    
                                    // Enforce max attribute cap
                                    const cappedValue = Math.min(newValue, maxValue);
                                    updateSelected({
                                      [key]: cappedValue,
                                    } as any);
                                  }}
                                  className="text-center"
                                />
                              </FormField>
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <div className="text-center">
                                  <p className="text-[10px] text-zinc-400">Mod</p>
                                  <p className="text-sm font-medium text-amber-200">{modSign}{mod}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] text-zinc-400">%</p>
                                  <p className="text-sm font-medium text-emerald-200">{percent}</p>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                      <Card className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3">
                        <FormField label="HP Total" htmlFor="char-hp-total">
                          <Input
                            id="char-hp-total"
                            type="number"
                            value={selected.hp_total ?? ""}
                            readOnly
                            className="bg-black/40 text-emerald-200 font-semibold"
                          />
                        </FormField>
                        <p className="text-[10px] text-zinc-400 mt-1">
                          Auto: (CON × 2) + CON Mod
                        </p>
                      </Card>
                      
                      <Card className="rounded-xl border border-blue-400/30 bg-blue-400/5 p-3">
                        <FormField label="Initiative" htmlFor="char-initiative-display">
                          <Input
                            id="char-initiative-display"
                            type="number"
                            value={selected.initiative ?? ""}
                            readOnly
                            className="bg-black/40 text-blue-200 font-semibold"
                          />
                        </FormField>
                        <p className="text-[10px] text-zinc-400 mt-1">
                          Auto: Base Init ({calculateBaseInitiative(selected.dexterity ?? null)}) × Base Movement ({selected.base_movement ?? 5})
                        </p>
                      </Card>

                      <Card className="rounded-xl border border-purple-400/30 bg-purple-400/5 p-3">
                        <FormField label="Mana" htmlFor="char-mana">
                          <Input
                            id="char-mana"
                            type="number"
                            value={selected.mana ?? ""}
                            readOnly
                            className="bg-black/40 text-purple-200 font-semibold"
                            placeholder="Calculation TBD"
                          />
                        </FormField>
                        <p className="text-[10px] text-zinc-400 mt-1">
                          Mana calculation coming soon
                        </p>
                      </Card>
                    </div>

                    <Card className="mt-2 rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-zinc-100">Location Hit Points</p>
                          <p className="text-[11px] text-zinc-400">Split from total HP for called shots and injuries.</p>
                        </div>
                        <span className="text-xs text-emerald-200 font-semibold">Total: {selected.hp_total ?? 0}</span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          ["Head", locationHP.head],
                          ["Chest", locationHP.chest],
                          ["Left Arm", locationHP.leftArm],
                          ["Right Arm", locationHP.rightArm],
                          ["Left Leg", locationHP.leftLeg],
                          ["Right Leg", locationHP.rightLeg],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <p className="text-[11px] text-zinc-400">{label}</p>
                            <p className="text-sm font-semibold text-zinc-100">{value}</p>
                          </div>
                        ))}
                      </div>

                      <p className="mt-3 text-[11px] text-zinc-400">
                        Auto-calculated from HP Total (Head 10%, Chest 30%, each limb 15%).
                      </p>
                    </Card>

                    <FormField
                      label="Defense Notes"
                      htmlFor="char-defense-notes"
                      description="Resistances, vulnerabilities, special defenses."
                    >
                      <textarea
                        id="char-defense-notes"
                        value={selected.defense_notes ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            defense_notes: e.target.value,
                          })
                        }
                        className="w-full min-h-[120px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                      />
                    </FormField>
                  </div>
                )}

                {/* SKILLS & ABILITIES TAB */}
                {activeTab === "skills" && (
                  <div className="space-y-4">
                    <Card className={[
                      "rounded-2xl border p-4",
                      skillPointsRemaining < 0 
                        ? "border-red-400/40 bg-red-400/10" 
                        : selected.is_initial_setup_locked
                        ? "border-blue-400/30 bg-blue-400/5"
                        : "border-emerald-400/30 bg-emerald-400/5"
                    ].join(" ")}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-zinc-200">
                            {selected.is_initial_setup_locked ? "XP Remaining" : "Skill Point Budget"}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {selected.is_initial_setup_locked 
                              ? `CR ${selected.challenge_rating}: ${availableXP.toLocaleString()} total • ${xpSpent.toLocaleString()} spent`
                              : `Tier 1 Skills Only • Total budget: ${skillPointBudget} points`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={[
                            "text-2xl font-bold",
                            skillPointsRemaining < 0 ? "text-red-300" : selected.is_initial_setup_locked ? "text-blue-200" : "text-emerald-200"
                          ].join(" ")}>
                            {selected.is_initial_setup_locked ? xpRemaining.toLocaleString() : skillPointsRemaining}
                          </p>
                          <p className="text-xs text-zinc-400">{selected.is_initial_setup_locked ? "XP" : "remaining"}</p>
                        </div>
                      </div>
                      {!selected.is_initial_setup_locked && skillPointsRemaining < 0 && (
                        <p className="text-xs text-red-300 mt-2">
                          ⚠️ Over budget! Reduce skill allocations to continue.
                        </p>
                      )}
                      {!selected.is_initial_setup_locked && skillPointsRemaining === 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={lockInitialSetup}
                            className="w-full"
                          >
                            Lock Initial Setup & Enable XP Spending
                          </Button>
                          <p className="text-xs text-zinc-400 mt-2 text-center">
                            Once locked, you can spend XP to further improve skills.
                          </p>
                        </div>
                      )}
                      {selected.is_initial_setup_locked && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                          <p className="text-xs text-blue-300">
                            ✓ Initial setup locked. Use XP to improve skills further.
                          </p>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={createCheckpoint}
                            className="w-full"
                            disabled={xpSpent === (selected.xp_checkpoint ?? 0)}
                          >
                            Create Checkpoint (Save Current State)
                          </Button>
                          <p className="text-xs text-zinc-400 text-center">
                            Checkpoints let you reduce skills to try new builds.
                          </p>
                        </div>
                      )}
                    </Card>

                    {/* Skill Sub-Tabs */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "strength" as const, label: "Strength" },
                        { id: "dexterity" as const, label: "Dexterity" },
                        { id: "constitution" as const, label: "Constitution" },
                        { id: "intelligence" as const, label: "Intelligence" },
                        { id: "wisdom" as const, label: "Wisdom" },
                        { id: "charisma" as const, label: "Charisma" },
                        { id: "special" as const, label: "Special Abilities" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSkillSubTab(tab.id)}
                          className={[
                            "px-3 py-1.5 text-sm rounded-lg border transition",
                            skillSubTab === tab.id
                              ? "border-violet-400/40 bg-violet-400/10 text-violet-200"
                              : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                          ].join(" ")}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {allSkills.length === 0 ? (
                      <Card className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-6">
                        <div className="text-center space-y-3">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-2">
                            <svg
                              className="w-8 h-8 text-amber-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-amber-200">
                            Skills Coming Soon
                          </h3>
                          <p className="text-sm text-zinc-300 max-w-md mx-auto">
                            Skill loading will be implemented when database connection is added.
                          </p>
                        </div>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        <Card className="rounded-2xl border border-white/10 bg-black/20 p-4 max-h-[400px] overflow-y-auto">
                          <div className="space-y-3">
                            {(() => {
                              // Filter skills by current sub-tab attribute
                              const step1Filtered = allSkills.filter((skill) => {
                                const primary = skill.primaryAttribute?.toUpperCase();
                                const secondary = skill.secondaryAttribute?.toUpperCase();
                                
                                if (skillSubTab === "special") {
                                  return skill.type === "special ability";
                                }
                                
                                const attrMatch = skillSubTab.substring(0, 3).toUpperCase();
                                return primary === attrMatch || secondary === attrMatch;
                              });
                              
                              console.log(`[${skillSubTab}] Step 1: ${step1Filtered.length} skills match attribute (T1:${step1Filtered.filter(s => s.tier === 1).length}, T2:${step1Filtered.filter(s => s.tier === 2).length}, T3:${step1Filtered.filter(s => s.tier === 3).length})`);
                              
                              // Filter by unlock status using campaign rules
                              const filteredSkills = step1Filtered.filter((skill) => {
                                return isSkillUnlocked(skill);
                              });
                              
                              console.log(`[${skillSubTab}] Step 2: ${filteredSkills.length} unlocked (T1:${filteredSkills.filter(s => s.tier === 1).length}, T2:${filteredSkills.filter(s => s.tier === 2).length}, T3:${filteredSkills.filter(s => s.tier === 3).length})`);

                              if (filteredSkills.length === 0) {
                                return (
                                  <div className="text-center py-8">
                                    <p className="text-sm text-zinc-400">
                                      No {skillSubTab === "special" ? "special ability" : skillSubTab} skills available.
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1">
                                      Skills will appear here when database is connected.
                                    </p>
                                  </div>
                                );
                              }

                              // Show all unlocked skills (tier 1, 2, and 3)
                              // Deduplicate by skill ID to prevent showing same skill multiple times
                              const uniqueSkills = Array.from(new Map(filteredSkills.map(s => [s.id, s])).values());
                              
                              // Only show tier 1 skills at top level - tier 2/3 will be nested under parents
                              const skillsToDisplay = uniqueSkills.filter(s => s.tier === 1);
                              
                              return skillsToDisplay.map((skill) => {
                                const allocated = selected.skill_allocations?.[skill.id] ?? 0;
                                const checkpointValue = (selected.skill_checkpoint || {})[skill.id] ?? 0;
                                const canDecrease = selected.is_initial_setup_locked ? allocated > checkpointValue : allocated > 0;
                                const rank = calculateSkillRank(allocated, skill.primaryAttribute || "", skill.id, skill.tier);
                                const percent = calculateSkillPercent(allocated, skill.primaryAttribute || "", skill.id, skill.tier);
                                const atMax = allocated >= 10 && !selected.is_initial_setup_locked;
                                
                                let nextUpgradeCost = 0;
                                if (selected.is_initial_setup_locked) {
                                  if (allocated === 0) {
                                    nextUpgradeCost = 10;
                                  } else {
                                    nextUpgradeCost = allocated;
                                  }
                                } else {
                                  nextUpgradeCost = 1;
                                }
                                
                                const childSkills = uniqueSkills.filter(s => 
                                  s.tier === 2 && (s.parentId === skill.id || s.parent2Id === skill.id || s.parent3Id === skill.id)
                                );
                                
                                return (
                                  <div key={skill.id} className="space-y-2">
                                    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm font-medium text-zinc-200">{skill.name}</p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                          <span className="text-xs text-zinc-400">Rank: {rank}</span>
                                          <span className="text-xs text-emerald-300">%: {percent}</span>
                                          {atMax && <span className="text-xs text-amber-300">MAX</span>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => updateSkillAllocation(skill.id, Math.max(0, allocated - 1))}
                                          disabled={!canDecrease}
                                        >
                                          -
                                        </Button>
                                        <span className="text-sm font-semibold text-violet-200 w-12 text-center">
                                          {allocated}
                                        </span>
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => updateSkillAllocation(skill.id, allocated + 1)}
                                          disabled={
                                            selected.is_initial_setup_locked 
                                              ? xpRemaining < nextUpgradeCost
                                              : (atMax || skillPointsRemaining <= 0)
                                          }
                                        >
                                          +
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {childSkills.map((childSkill) => {
                                      const childAllocationKey = getAllocationKey(childSkill.id, skill.id);
                                      const childAllocated = selected.skill_allocations?.[childAllocationKey] ?? 0;
                                      const childCheckpointValue = (selected.skill_checkpoint || {})[childAllocationKey] ?? 0;
                                      const childCanDecrease = selected.is_initial_setup_locked ? childAllocated > childCheckpointValue : childAllocated > 0;
                                      const childRank = calculateSkillRank(childAllocated, childSkill.primaryAttribute || "", childSkill.id, childSkill.tier, skill.id);
                                      const childPercent = calculateSkillPercent(childAllocated, childSkill.primaryAttribute || "", childSkill.id, childSkill.tier, skill.id);
                                      const childAtMax = childAllocated >= 10 && !selected.is_initial_setup_locked;
                                      
                                      let childNextUpgradeCost = 0;
                                      if (selected.is_initial_setup_locked) {
                                        if (childAllocated === 0) {
                                          childNextUpgradeCost = 10;
                                        } else {
                                          childNextUpgradeCost = childAllocated;
                                        }
                                      } else {
                                        childNextUpgradeCost = 1;
                                      }
                                      
                                      const tier3Children = uniqueSkills.filter(s => 
                                        s.tier === 3 && (s.parentId === childSkill.id || s.parent2Id === childSkill.id || s.parent3Id === childSkill.id)
                                      );
                                      
                                      return (
                                        <div key={childSkill.id} className="space-y-2">
                                          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/5 border border-white/10 ml-6">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-zinc-200">{childSkill.name}</p>
                                                <span className={[
                                                  "text-xs px-1.5 py-0.5 rounded font-semibold",
                                                  childSkill.tier === 2 ? "bg-blue-500/20 text-blue-300" : "bg-purple-500/20 text-purple-300"
                                                ].join(" ")}>
                                                  T{childSkill.tier}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-zinc-400">Rank: {childRank}</span>
                                                <span className="text-xs text-emerald-300">%: {childPercent}</span>
                                                {childAtMax && <span className="text-xs text-amber-300">MAX</span>}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => updateSkillAllocation(childSkill.id, Math.max(0, childAllocated - 1), skill.id)}
                                                disabled={!childCanDecrease}
                                              >
                                                -
                                              </Button>
                                              <span className="text-sm font-semibold text-violet-200 w-12 text-center">{childAllocated}</span>
                                              <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => updateSkillAllocation(childSkill.id, childAllocated + 1, skill.id)}
                                                disabled={
                                                  selected.is_initial_setup_locked
                                                    ? (childAtMax || xpRemaining < childNextUpgradeCost)
                                                    : (childAtMax || skillPointsRemaining <= 0)
                                                }
                                              >
                                                +
                                              </Button>
                                            </div>
                                          </div>
                                          
                                          {tier3Children.map((tier3Skill) => {
                                            // Tier 3 key format: tier1Id:tier2Id:tier3Id
                                            const t3AllocationKey = `${skill.id}:${childSkill.id}:${tier3Skill.id}`;
                                            const t3Allocated = selected.skill_allocations?.[t3AllocationKey] ?? 0;
                                            const t3CheckpointValue = (selected.skill_checkpoint || {})[t3AllocationKey] ?? 0;
                                            const t3CanDecrease = selected.is_initial_setup_locked ? t3Allocated > t3CheckpointValue : t3Allocated > 0;
                                            // Pass tier 2 parent with tier 1 context (tier1Id:tier2Id) so it calculates from tier 2 rank properly
                                            const t3ParentContext = `${skill.id}:${childSkill.id}`;
                                            const t3Rank = calculateSkillRank(t3Allocated, tier3Skill.primaryAttribute || "", tier3Skill.id, tier3Skill.tier, t3ParentContext);
                                            const t3Percent = calculateSkillPercent(t3Allocated, tier3Skill.primaryAttribute || "", tier3Skill.id, tier3Skill.tier, t3ParentContext);
                                            const t3AtMax = t3Allocated >= 10 && !selected.is_initial_setup_locked;
                                            
                                            let t3NextUpgradeCost = 0;
                                            if (selected.is_initial_setup_locked) {
                                              if (t3Allocated === 0) {
                                                t3NextUpgradeCost = 10;
                                              } else {
                                                t3NextUpgradeCost = t3Allocated;
                                              }
                                            } else {
                                              t3NextUpgradeCost = 1;
                                            }
                                            
                                            return (
                                              <div key={tier3Skill.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/5 border border-white/10 ml-12">
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-zinc-200">{tier3Skill.name}</p>
                                                    <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-purple-500/20 text-purple-300">
                                                      T3
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs text-zinc-400">Rank: {t3Rank}</span>
                                                    <span className="text-xs text-emerald-300">%: {t3Percent}</span>
                                                    {t3AtMax && <span className="text-xs text-amber-300">MAX</span>}
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => updateSkillAllocation(tier3Skill.id, Math.max(0, t3Allocated - 1), `${skill.id}:${childSkill.id}`)}
                                                    disabled={!t3CanDecrease}
                                                  >
                                                    -
                                                  </Button>
                                                  <span className="text-sm font-semibold text-violet-200 w-12 text-center">{t3Allocated}</span>
                                                  <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => updateSkillAllocation(tier3Skill.id, t3Allocated + 1, `${skill.id}:${childSkill.id}`)}
                                                    disabled={
                                                      selected.is_initial_setup_locked
                                                        ? (t3AtMax || xpRemaining < t3NextUpgradeCost)
                                                        : (t3AtMax || skillPointsRemaining <= 0)
                                                    }
                                                  >
                                                    +
                                                  </Button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </Card>
                      </div>
                    )}

                    <Card className="rounded-2xl border border-blue-300/30 bg-blue-300/5 p-4">
                      <p className="text-xs text-zinc-300">
                        <span className="font-semibold text-blue-200">Note:</span> Skills will be loaded from the database once connected. The skill allocation system supports initial 50-point budgets and XP-based progression.
                      </p>
                    </Card>
                  </div>
                )}

                {/* STORY & PERSONALITY TAB */}
                {activeTab === "story" && (
                  <div className="space-y-4">
                    <FormField
                      label="Personality Summary"
                      htmlFor="char-personality"
                      description="Quick overview of your character's demeanor and general vibe"
                    >
                      <textarea
                        id="char-personality"
                        value={selected.personality ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            personality: e.target.value,
                          })
                        }
                        className="w-full min-h-[100px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        placeholder="Describe your character's personality, mannerisms, and general demeanor..."
                      />
                    </FormField>

                    <FormField
                      label="Moral Code"
                      htmlFor="char-ideals"
                      description="Your character's beliefs, values, important bonds, and personal flaws"
                    >
                      <textarea
                        id="char-ideals"
                        value={selected.ideals ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            ideals: e.target.value,
                          })
                        }
                        className="w-full min-h-[140px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        placeholder="Describe your character's moral framework: What do they believe in? What principles guide their actions? Who or what matters most to them (bonds)? What weaknesses or flaws define them? How do these ideals, bonds, and flaws shape their decisions..."
                      />
                    </FormField>

                    <FormField
                      label="Goals"
                      htmlFor="char-goals"
                      description="What are you actively trying to achieve?"
                    >
                      <textarea
                        id="char-goals"
                        value={selected.goals ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            goals: e.target.value,
                          })
                        }
                        className="w-full min-h-[80px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        placeholder="Short-term and long-term goals..."
                      />
                    </FormField>

                    <FormField
                      label="Secrets"
                      htmlFor="char-secrets"
                      description="Things you hide from others (or yourself)"
                    >
                      <textarea
                        id="char-secrets"
                        value={selected.secrets ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            secrets: e.target.value,
                          })
                        }
                        className="w-full min-h-[80px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        placeholder="Hidden truths, dark past, secret identity..."
                      />
                    </FormField>

                    <FormField
                      label="Backstory"
                      htmlFor="char-backstory"
                      description="Your character's history and origin story"
                    >
                      <textarea
                        id="char-backstory"
                        value={selected.backstory ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            backstory: e.target.value,
                          })
                        }
                        className="w-full min-h-[160px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        placeholder="Where did you come from? What shaped you into who you are today?"
                      />
                    </FormField>

                    <FormField
                      label="Motivations"
                      htmlFor="char-motivations"
                      description="What drives you? What do you value most?"
                    >
                      <textarea
                        id="char-motivations"
                        value={selected.motivations ?? ""}
                        onChange={(e) =>
                          updateSelected({
                            motivations: e.target.value,
                          })
                        }
                        className="w-full min-h-[100px] rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2 text-sm text-zinc-100"
                        placeholder="What keeps you going? What would you sacrifice everything for?"
                      />
                    </FormField>
                  </div>
                )}

                {/* PURCHASE EQUIPMENT TAB */}
                {activeTab === "equipment" && (
                  <div className="space-y-4">
                    <Card className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-amber-200">Available Credits</h3>
                          <p className="text-xs text-zinc-400 mt-1">Starting credits from campaign</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-emerald-200">
                            {campaign?.startingCredits ?? 0}
                          </p>
                          <p className="text-xs text-zinc-400">credits</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="rounded-2xl border border-white/10 bg-black/20 p-6">
                      <div className="text-center space-y-3">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/20 mb-2">
                          <svg
                            className="w-8 h-8 text-violet-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-violet-200">
                          Equipment Shop Coming Soon
                        </h3>
                        <p className="text-sm text-zinc-300 max-w-md mx-auto">
                          Browse and purchase weapons, armor, and items from your GM&apos;s approved equipment list.
                        </p>
                      </div>
                    </Card>
                  </div>
                )}

                {/* OTHER TABS - Placeholder */}
                {activeTab !== "identity" && activeTab !== "attributes" && activeTab !== "skills" && activeTab !== "story" && activeTab !== "equipment" && (
                  <Card className="rounded-2xl border border-blue-300/30 bg-blue-300/5 p-4">
                    <p className="text-sm text-zinc-300">
                      <span className="font-semibold text-blue-200">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Tab:</span> Coming soon. We&apos;ll build this next.
                    </p>
                  </Card>
                )}
              </div>
            </>
          )}
        </Card>
        </section>
      )}
    </main>
  );
}
