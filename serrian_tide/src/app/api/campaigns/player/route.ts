import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

// GET /api/campaigns/player - Get all campaigns where user is a player
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Get campaigns where user is a player via campaignPlayers join
    const playerCampaigns = await db
      .select({
        id: schema.campaigns.id,
        name: schema.campaigns.name,
        genre: schema.campaigns.genre,
        attributePoints: schema.campaigns.attributePoints,
        skillPoints: schema.campaigns.skillPoints,
        allowedRaces: schema.campaigns.allowedRaces,
        tier1Enabled: schema.campaigns.tier1Enabled,
        tier2Enabled: schema.campaigns.tier2Enabled,
        tier3Enabled: schema.campaigns.tier3Enabled,
        spellcraftEnabled: schema.campaigns.spellcraftEnabled,
        talismanismEnabled: schema.campaigns.talismanismEnabled,
        faithEnabled: schema.campaigns.faithEnabled,
        psyonicsEnabled: schema.campaigns.psyonicsEnabled,
        bardicResonancesEnabled: schema.campaigns.bardicResonancesEnabled,
        specialAbilitiesEnabled: schema.campaigns.specialAbilitiesEnabled,
        createdBy: schema.campaigns.createdBy,
        createdAt: schema.campaigns.createdAt,
        campaignPlayerId: schema.campaignPlayers.id,
      })
      .from(schema.campaignPlayers)
      .innerJoin(schema.campaigns, eq(schema.campaignPlayers.campaignId, schema.campaigns.id))
      .where(eq(schema.campaignPlayers.userId, user.id))
      .orderBy(schema.campaigns.name);

    return NextResponse.json({ ok: true, campaigns: playerCampaigns });
  } catch (err) {
    console.error("Get player campaigns error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
