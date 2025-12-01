import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { campaigns, campaignStoreItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import { randomUUID } from "crypto";

// GET /api/campaigns/[id]/store - List all store items for a campaign
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

    // Verify user owns the campaign
    const campaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    console.log('GET Store - Campaign check:', {
      campaignId,
      userId: user.id,
      userRole: user.role,
      campaignFound: campaign.length > 0,
      campaignCreatedBy: campaign[0]?.createdBy,
      matches: campaign[0]?.createdBy === user.id
    });

    if (!campaign.length || !campaign[0]) {
      return NextResponse.json(
        { ok: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Check ownership (allow admin access)
    if (user.role !== 'admin' && campaign[0].createdBy !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Get all store items for this campaign
    const storeItems = await db
      .select()
      .from(campaignStoreItems)
      .where(eq(campaignStoreItems.campaignId, campaignId));

    return NextResponse.json({
      ok: true,
      items: storeItems,
    });
  } catch (err) {
    console.error("Error fetching campaign store items:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/campaigns/[id]/store - Add items to the store
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;
    const body = await req.json();
    const { items } = body; // Array of { sourceType, sourceId, name, itemType, costCredits }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Items array is required" },
        { status: 400 }
      );
    }

    // Verify user owns the campaign
    const campaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    console.log('POST Store - Campaign check:', {
      campaignId,
      userId: user.id,
      userRole: user.role,
      campaignFound: campaign.length > 0,
      campaignCreatedBy: campaign[0]?.createdBy,
      matches: campaign[0]?.createdBy === user.id,
      itemCount: items.length
    });

    if (!campaign.length || !campaign[0]) {
      return NextResponse.json(
        { ok: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Check ownership (allow admin access)
    if (user.role !== 'admin' && campaign[0].createdBy !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Insert items (skip duplicates)
    const inserted = [];
    for (const item of items) {
      // Check if item already exists
      const existing = await db
        .select()
        .from(campaignStoreItems)
        .where(
          and(
            eq(campaignStoreItems.campaignId, campaignId),
            eq(campaignStoreItems.sourceType, item.sourceType),
            eq(campaignStoreItems.sourceId, item.sourceId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        continue; // Skip duplicates
      }

      const newItem = {
        id: randomUUID(),
        campaignId,
        sourceType: item.sourceType,
        sourceId: item.sourceId,
        name: item.name,
        itemType: item.itemType,
        costCredits: item.costCredits || 0,
        isEnabled: true,
        createdAt: new Date(),
      };

      await db.insert(campaignStoreItems).values(newItem);
      inserted.push(newItem);
    }

    return NextResponse.json({
      ok: true,
      inserted: inserted.length,
      items: inserted,
    });
  } catch (err) {
    console.error("Error adding items to campaign store:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
