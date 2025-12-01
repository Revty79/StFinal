import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { campaigns, campaignStoreItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

// DELETE /api/campaigns/[id]/store/[itemId] - Remove an item from the store
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId, itemId } = await params;

    // Verify user owns the campaign
    const campaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

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

    // Delete the item
    await db
      .delete(campaignStoreItems)
      .where(
        and(
          eq(campaignStoreItems.id, itemId),
          eq(campaignStoreItems.campaignId, campaignId)
        )
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error deleting campaign store item:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/campaigns/[id]/store/[itemId] - Toggle item enabled status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId, itemId } = await params;
    const body = await req.json();
    const { isEnabled } = body;

    // Verify user owns the campaign
    const campaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

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

    // Update the item
    await db
      .update(campaignStoreItems)
      .set({ isEnabled })
      .where(
        and(
          eq(campaignStoreItems.id, itemId),
          eq(campaignStoreItems.campaignId, campaignId)
        )
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error updating campaign store item:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
