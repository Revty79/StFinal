import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and, inArray } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";

// GET /api/campaigns/[id] - Get single campaign with all related data
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await context.params;

    // Get campaign
    const [campaign] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, id))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // Check if user has access (either as GM or as a player)
    const isGM = campaign.createdBy === user.id;
    
    if (!isGM) {
      // Check if user is a player in this campaign
      const [playerRecord] = await db
        .select()
        .from(schema.campaignPlayers)
        .where(and(
          eq(schema.campaignPlayers.campaignId, id),
          eq(schema.campaignPlayers.userId, user.id)
        ))
        .limit(1);
      
      if (!playerRecord) {
        return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
      }
    }

    // Get currencies
    const currencies = await db
      .select()
      .from(schema.campaignCurrencies)
      .where(eq(schema.campaignCurrencies.campaignId, id));

    // Get players with their characters
    const players = await db
      .select({
        id: schema.campaignPlayers.id,
        userId: schema.campaignPlayers.userId,
        userName: schema.users.username,
        addedAt: schema.campaignPlayers.addedAt,
      })
      .from(schema.campaignPlayers)
      .leftJoin(schema.users, eq(schema.campaignPlayers.userId, schema.users.id))
      .where(eq(schema.campaignPlayers.campaignId, id));

    // Get all characters for these players
    const playerIds = players.map(p => p.id);
    const characters = playerIds.length > 0
      ? await db
          .select()
          .from(schema.campaignCharacters)
          .where(inArray(schema.campaignCharacters.campaignPlayerId, playerIds))
      : [];

    // Group characters by player
    const playersWithCharacters = players.map(player => ({
      id: player.id,
      userId: player.userId,
      userName: player.userName || "Unknown",
      characters: characters.filter(c => c.campaignPlayerId === player.id),
    }));

    return NextResponse.json({
      ok: true,
      campaign: {
        ...campaign,
        currencies,
        players: playersWithCharacters,
      },
    });
  } catch (err) {
    console.error("Get campaign error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// PUT /api/campaigns/[id] - Update campaign
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => null) as any;

    if (!body) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    // Check ownership
    const [existing] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    if (existing.createdBy !== user.id) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    // Update campaign
    const updates: any = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updates.name = body.name;
    if (body.genre !== undefined) updates.genre = body.genre;
    if (body.attributePoints !== undefined) updates.attributePoints = body.attributePoints;
    if (body.skillPoints !== undefined) updates.skillPoints = body.skillPoints;
    if (body.maxPointsInSkill !== undefined) updates.maxPointsInSkill = body.maxPointsInSkill;
    if (body.pointsNeededForNextTier !== undefined) updates.pointsNeededForNextTier = body.pointsNeededForNextTier;
    if (body.maxAllowedInTier !== undefined) updates.maxAllowedInTier = body.maxAllowedInTier;
    if (body.tier1Enabled !== undefined) updates.tier1Enabled = body.tier1Enabled;
    if (body.tier2Enabled !== undefined) updates.tier2Enabled = body.tier2Enabled;
    if (body.tier3Enabled !== undefined) updates.tier3Enabled = body.tier3Enabled;
    if (body.spellcraftEnabled !== undefined) updates.spellcraftEnabled = body.spellcraftEnabled;
    if (body.talismanismEnabled !== undefined) updates.talismanismEnabled = body.talismanismEnabled;
    if (body.faithEnabled !== undefined) updates.faithEnabled = body.faithEnabled;
    if (body.psyonicsEnabled !== undefined) updates.psyonicsEnabled = body.psyonicsEnabled;
    if (body.bardicResonancesEnabled !== undefined) updates.bardicResonancesEnabled = body.bardicResonancesEnabled;
    if (body.specialAbilitiesEnabled !== undefined) updates.specialAbilitiesEnabled = body.specialAbilitiesEnabled;
    if (body.allowedRaces !== undefined) updates.allowedRaces = body.allowedRaces;
    if (body.startingCredits !== undefined) updates.startingCredits = body.startingCredits;

    await db
      .update(schema.campaigns)
      .set(updates)
      .where(eq(schema.campaigns.id, id));

    // Handle currencies if provided
    if (body.currencies !== undefined) {
      // Delete existing currencies
      await db
        .delete(schema.campaignCurrencies)
        .where(eq(schema.campaignCurrencies.campaignId, id));

      // Insert new currencies
      if (body.currencies.length > 0) {
        const currenciesToInsert = body.currencies.map((c: any) => ({
          id: c.id || crypto.randomUUID(),
          campaignId: id,
          name: c.name,
          creditValue: c.creditValue,
        }));
        await db.insert(schema.campaignCurrencies).values(currenciesToInsert);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update campaign error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id] - Delete campaign
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await context.params;

    // Check ownership
    const [existing] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    if (existing.createdBy !== user.id) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    // Delete campaign (cascades to currencies, players, characters)
    await db.delete(schema.campaigns).where(eq(schema.campaigns.id, id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete campaign error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
