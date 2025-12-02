import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";

// GET /api/campaigns/[id]/characters - Get all characters for a campaign
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id: campaignId } = await context.params;

    // Get campaign
    const [campaign] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, campaignId))
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
          eq(schema.campaignPlayers.campaignId, campaignId),
          eq(schema.campaignPlayers.userId, user.id)
        ))
        .limit(1);
      
      if (!playerRecord) {
        return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
      }
    }

    // Get all characters for this campaign
    const characters = await db
      .select()
      .from(schema.campaignCharacters)
      .innerJoin(
        schema.campaignPlayers,
        eq(schema.campaignCharacters.campaignPlayerId, schema.campaignPlayers.id)
      )
      .where(eq(schema.campaignPlayers.campaignId, campaignId));

    const formattedCharacters = characters.map(row => ({
      id: row.campaign_characters.id,
      name: row.campaign_characters.name,
      campaignPlayerId: row.campaign_characters.campaignPlayerId,
      isSetupComplete: row.campaign_characters.isSetupComplete,
      createdAt: row.campaign_characters.createdAt,
      updatedAt: row.campaign_characters.updatedAt,
    }));

    return NextResponse.json({ ok: true, characters: formattedCharacters });
  } catch (err) {
    console.error("Get characters error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/campaigns/[id]/characters - Add character to player
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id: campaignId } = await context.params;
    const body = await req.json().catch(() => null) as any;

    // Accept either playerId or campaignPlayerId for backwards compatibility
    const playerIdValue = body.campaignPlayerId || body.playerId;
    
    if (!body || !playerIdValue || !body.name) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    // Check campaign exists
    const [campaign] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // Check if user has permission (GM or the player creating their own character)
    const isGM = campaign.createdBy === user.id;
    
    if (!isGM) {
      // Verify this campaignPlayerId belongs to the current user
      const [playerRecord] = await db
        .select()
        .from(schema.campaignPlayers)
        .where(and(
          eq(schema.campaignPlayers.id, playerIdValue),
          eq(schema.campaignPlayers.userId, user.id)
        ))
        .limit(1);
      
      if (!playerRecord) {
        return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
      }
    }

    const id = crypto.randomUUID();

    // Set initial credits from campaign's startingCredits
    await db.insert(schema.campaignCharacters).values({
      id,
      campaignPlayerId: playerIdValue,
      name: body.name,
      creditsRemaining: campaign.startingCredits,
      isSetupComplete: body.isSetupComplete ?? false,
    });

    return NextResponse.json({
      ok: true,
      character: {
        id,
        name: body.name,
        campaignPlayerId: playerIdValue,
        creditsRemaining: campaign.startingCredits,
        isSetupComplete: body.isSetupComplete ?? false,
      },
    });
  } catch (err) {
    console.error("Add character error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// PUT /api/campaigns/[id]/characters - Update character name
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id: campaignId } = await context.params;
    const body = await req.json().catch(() => null) as any;

    if (!body || !body.characterId || !body.name) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    // Check campaign ownership
    const [campaign] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    if (campaign.createdBy !== user.id) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    await db
      .update(schema.campaignCharacters)
      .set({ name: body.name, updatedAt: new Date() })
      .where(eq(schema.campaignCharacters.id, body.characterId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update character error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id]/characters - Remove character
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const characterId = searchParams.get("characterId");

    if (!characterId) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const { id: campaignId } = await context.params;

    // Check campaign ownership
    const [campaign] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    if (campaign.createdBy !== user.id) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    await db
      .delete(schema.campaignCharacters)
      .where(eq(schema.campaignCharacters.id, characterId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Remove character error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
