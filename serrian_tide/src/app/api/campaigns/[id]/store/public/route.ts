import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { campaignStoreItems, campaignPlayers, campaigns } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

// GET /api/campaigns/[id]/store/public - Get store items visible to players
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;

    // Verify user is a player in this campaign OR is the GM
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return NextResponse.json(
        { ok: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Check if user is GM
    const isGM = campaign.createdBy === user.id;

    // Check if user is a player
    let isPlayer = false;
    if (!isGM) {
      const [playerRecord] = await db
        .select()
        .from(campaignPlayers)
        .where(
          and(
            eq(campaignPlayers.campaignId, campaignId),
            eq(campaignPlayers.userId, user.id)
          )
        )
        .limit(1);

      isPlayer = !!playerRecord;
    }

    if (!isGM && !isPlayer) {
      return NextResponse.json(
        { ok: false, error: "Access denied - not a player or GM in this campaign" },
        { status: 403 }
      );
    }

    // Get all enabled store items for this campaign
    const storeItems = await db
      .select()
      .from(campaignStoreItems)
      .where(
        and(
          eq(campaignStoreItems.campaignId, campaignId),
          eq(campaignStoreItems.isEnabled, true)
        )
      );

    return NextResponse.json({
      ok: true,
      items: storeItems,
    });
  } catch (err) {
    console.error("Error fetching public store items:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
