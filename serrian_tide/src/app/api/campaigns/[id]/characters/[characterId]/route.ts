import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

// GET /api/campaigns/[id]/characters/[characterId] - Get a specific character
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string; characterId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id: campaignId, characterId } = await context.params;

    // Get character with campaign player info
    const [result] = await db
      .select()
      .from(schema.campaignCharacters)
      .innerJoin(
        schema.campaignPlayers,
        eq(schema.campaignCharacters.campaignPlayerId, schema.campaignPlayers.id)
      )
      .where(eq(schema.campaignCharacters.id, characterId))
      .limit(1);

    if (!result) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // Check if user has access (either as GM or as the player who owns this character)
    const [campaign] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const isGM = campaign.createdBy === user.id;
    const isOwner = result.campaign_players.userId === user.id;

    if (!isGM && !isOwner) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    // Return full character data
    const character = {
      id: result.campaign_characters.id,
      name: result.campaign_characters.name,
      campaignPlayerId: result.campaign_characters.campaignPlayerId,
      
      // Identity fields
      playerName: result.campaign_characters.playerName,
      campaignName: result.campaign_characters.campaignName,
      raceId: result.campaign_characters.raceId,
      race: result.campaign_characters.race,
      age: result.campaign_characters.age,
      baseMagic: result.campaign_characters.baseMagic,
      baseMovement: result.campaign_characters.baseMovement,
      sex: result.campaign_characters.sex,
      height: result.campaign_characters.height,
      weight: result.campaign_characters.weight,
      skinColor: result.campaign_characters.skinColor,
      eyeColor: result.campaign_characters.eyeColor,
      hairColor: result.campaign_characters.hairColor,
      deity: result.campaign_characters.deity,
      definingMarks: result.campaign_characters.definingMarks,
      
      // In-game values
      fame: result.campaign_characters.fame,
      experience: result.campaign_characters.experience,
      totalExperience: result.campaign_characters.totalExperience,
      quintessence: result.campaign_characters.quintessence,
      totalQuintessence: result.campaign_characters.totalQuintessence,
      
      // Attributes
      strength: result.campaign_characters.strength,
      dexterity: result.campaign_characters.dexterity,
      constitution: result.campaign_characters.constitution,
      intelligence: result.campaign_characters.intelligence,
      wisdom: result.campaign_characters.wisdom,
      charisma: result.campaign_characters.charisma,
      
      // Skills
      skillAllocations: result.campaign_characters.skillAllocations,
      
      // Story & Personality
      personality: result.campaign_characters.personality,
      goals: result.campaign_characters.goals,
      secrets: result.campaign_characters.secrets,
      backstory: result.campaign_characters.backstory,
      motivations: result.campaign_characters.motivations,
      
      // Connections & Power
      faction: result.campaign_characters.faction,
      relationships: result.campaign_characters.relationships,
      attitudeTowardParty: result.campaign_characters.attitudeTowardParty,
      allies: result.campaign_characters.allies,
      enemies: result.campaign_characters.enemies,
      affiliations: result.campaign_characters.affiliations,
      resources: result.campaign_characters.resources,
      
      // Equipment & Resources
      creditsRemaining: result.campaign_characters.creditsRemaining,
      equipment: result.campaign_characters.equipment,
      
      // Combat Stats
      hpTotal: result.campaign_characters.hpTotal,
      initiative: result.campaign_characters.initiative,
      mana: result.campaign_characters.mana,
      armorSoak: result.campaign_characters.armorSoak,
      defenseNotes: result.campaign_characters.defenseNotes,
      challengeRating: result.campaign_characters.challengeRating,
      
      // Skill Management
      skillCheckpoint: result.campaign_characters.skillCheckpoint,
      isInitialSetupLocked: result.campaign_characters.isInitialSetupLocked,
      xpSpent: result.campaign_characters.xpSpent,
      xpCheckpoint: result.campaign_characters.xpCheckpoint,
      
      notes: result.campaign_characters.notes,
      isSetupComplete: result.campaign_characters.isSetupComplete,
      createdAt: result.campaign_characters.createdAt,
      updatedAt: result.campaign_characters.updatedAt,
    };

    return NextResponse.json({ ok: true, character });
  } catch (err) {
    console.error("Get character error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// PUT /api/campaigns/[id]/characters/[characterId] - Update a character
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string; characterId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id: campaignId, characterId } = await context.params;
    const body = await req.json().catch(() => null) as any;

    if (!body) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    // Get character with campaign player info
    const [result] = await db
      .select()
      .from(schema.campaignCharacters)
      .innerJoin(
        schema.campaignPlayers,
        eq(schema.campaignCharacters.campaignPlayerId, schema.campaignPlayers.id)
      )
      .where(eq(schema.campaignCharacters.id, characterId))
      .limit(1);

    if (!result) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // Check if user has access (either as GM or as the player who owns this character)
    const [campaign] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const isGM = campaign.createdBy === user.id;
    const isOwner = result.campaign_players.userId === user.id;

    if (!isGM && !isOwner) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Identity fields
    if (body.name !== undefined) updateData.name = body.name;
    if (body.playerName !== undefined) updateData.playerName = body.playerName;
    if (body.campaignName !== undefined) updateData.campaignName = body.campaignName;
    if (body.raceId !== undefined) updateData.raceId = body.raceId;
    if (body.race !== undefined) updateData.race = body.race;
    if (body.age !== undefined) updateData.age = body.age;
    if (body.baseMagic !== undefined) updateData.baseMagic = body.baseMagic;
    if (body.baseMovement !== undefined) updateData.baseMovement = body.baseMovement;
    if (body.sex !== undefined) updateData.sex = body.sex;
    if (body.height !== undefined) updateData.height = body.height;
    if (body.weight !== undefined) updateData.weight = body.weight;
    if (body.skinColor !== undefined) updateData.skinColor = body.skinColor;
    if (body.eyeColor !== undefined) updateData.eyeColor = body.eyeColor;
    if (body.hairColor !== undefined) updateData.hairColor = body.hairColor;
    if (body.deity !== undefined) updateData.deity = body.deity;
    if (body.definingMarks !== undefined) updateData.definingMarks = body.definingMarks;

    // In-game values (typically GM-only but we'll allow for now)
    if (body.fame !== undefined) updateData.fame = body.fame;
    if (body.experience !== undefined) updateData.experience = body.experience;
    if (body.totalExperience !== undefined) updateData.totalExperience = body.totalExperience;
    if (body.quintessence !== undefined) updateData.quintessence = body.quintessence;
    if (body.totalQuintessence !== undefined) updateData.totalQuintessence = body.totalQuintessence;

    // Attributes
    if (body.strength !== undefined) updateData.strength = body.strength;
    if (body.dexterity !== undefined) updateData.dexterity = body.dexterity;
    if (body.constitution !== undefined) updateData.constitution = body.constitution;
    if (body.intelligence !== undefined) updateData.intelligence = body.intelligence;
    if (body.wisdom !== undefined) updateData.wisdom = body.wisdom;
    if (body.charisma !== undefined) updateData.charisma = body.charisma;

    // Skills
    if (body.skillAllocations !== undefined) updateData.skillAllocations = body.skillAllocations;

    // Story & Personality
    if (body.personality !== undefined) updateData.personality = body.personality;
    if (body.goals !== undefined) updateData.goals = body.goals;
    if (body.secrets !== undefined) updateData.secrets = body.secrets;
    if (body.backstory !== undefined) updateData.backstory = body.backstory;
    if (body.motivations !== undefined) updateData.motivations = body.motivations;

    // Connections & Power
    if (body.faction !== undefined) updateData.faction = body.faction;
    if (body.relationships !== undefined) updateData.relationships = body.relationships;
    if (body.attitudeTowardParty !== undefined) updateData.attitudeTowardParty = body.attitudeTowardParty;
    if (body.allies !== undefined) updateData.allies = body.allies;
    if (body.enemies !== undefined) updateData.enemies = body.enemies;
    if (body.affiliations !== undefined) updateData.affiliations = body.affiliations;
    if (body.resources !== undefined) updateData.resources = body.resources;

    // Equipment & Resources (Note: equipment is managed via purchase endpoint, but allow override)
    if (body.creditsRemaining !== undefined) updateData.creditsRemaining = body.creditsRemaining;
    if (body.equipment !== undefined) updateData.equipment = body.equipment;

    // Combat Stats
    if (body.hpTotal !== undefined) updateData.hpTotal = body.hpTotal;
    if (body.initiative !== undefined) updateData.initiative = body.initiative;
    if (body.mana !== undefined) updateData.mana = body.mana;
    if (body.armorSoak !== undefined) updateData.armorSoak = body.armorSoak;
    if (body.defenseNotes !== undefined) updateData.defenseNotes = body.defenseNotes;
    if (body.challengeRating !== undefined) updateData.challengeRating = body.challengeRating;

    // Skill Management
    if (body.skillCheckpoint !== undefined) updateData.skillCheckpoint = body.skillCheckpoint;
    if (body.isInitialSetupLocked !== undefined) updateData.isInitialSetupLocked = body.isInitialSetupLocked;
    if (body.xpSpent !== undefined) updateData.xpSpent = body.xpSpent;
    if (body.xpCheckpoint !== undefined) updateData.xpCheckpoint = body.xpCheckpoint;

    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.isSetupComplete !== undefined) updateData.isSetupComplete = body.isSetupComplete;

    console.log('Updating character with data:', {
      characterId,
      fieldsToUpdate: Object.keys(updateData),
      sampleData: {
        name: updateData.name,
        race: updateData.race,
        strength: updateData.strength,
      }
    });

    // Update the character
    await db
      .update(schema.campaignCharacters)
      .set(updateData)
      .where(eq(schema.campaignCharacters.id, characterId));

    console.log('Character updated successfully');

    return NextResponse.json({ ok: true });
  } catch (err) {
    const { id: campaignId, characterId } = await context.params;
    console.error("Update character error:", err);
    console.error("Error details:", {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      characterId,
      campaignId,
    });
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id]/characters/[characterId] - Delete a character
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string; characterId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id: campaignId, characterId } = await context.params;

    // Get character with campaign player info
    const [result] = await db
      .select()
      .from(schema.campaignCharacters)
      .innerJoin(
        schema.campaignPlayers,
        eq(schema.campaignCharacters.campaignPlayerId, schema.campaignPlayers.id)
      )
      .where(eq(schema.campaignCharacters.id, characterId))
      .limit(1);

    if (!result) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // Check if user has access (either as GM or as the player who owns this character)
    const [campaign] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const isGM = campaign.createdBy === user.id;
    const isOwner = result.campaign_players.userId === user.id;

    if (!isGM && !isOwner) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    // Delete the character
    await db
      .delete(schema.campaignCharacters)
      .where(eq(schema.campaignCharacters.id, characterId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete character error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
