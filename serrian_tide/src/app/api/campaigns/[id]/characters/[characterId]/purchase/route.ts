import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { campaignCharacters, campaignStoreItems, campaigns, campaignPlayers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

// POST /api/campaigns/[id]/characters/[characterId]/purchase - Purchase an item
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; characterId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId, characterId } = await params;
    const body = await req.json();
    const { storeItemId, quantity = 1 } = body;

    if (!storeItemId) {
      return NextResponse.json(
        { ok: false, error: "Store item ID is required" },
        { status: 400 }
      );
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { ok: false, error: "Quantity must be a positive integer" },
        { status: 400 }
      );
    }

    // Get the character
    const [character] = await db
      .select()
      .from(campaignCharacters)
      .where(eq(campaignCharacters.id, characterId))
      .limit(1);

    if (!character) {
      return NextResponse.json(
        { ok: false, error: "Character not found" },
        { status: 404 }
      );
    }

    // Verify the character belongs to this campaign's player
    const [campaignPlayer] = await db
      .select()
      .from(campaignPlayers)
      .where(
        and(
          eq(campaignPlayers.id, character.campaignPlayerId),
          eq(campaignPlayers.userId, user.id)
        )
      )
      .limit(1);

    if (!campaignPlayer) {
      return NextResponse.json(
        { ok: false, error: "Access denied - not your character" },
        { status: 403 }
      );
    }

    // Get the store item
    const [storeItem] = await db
      .select()
      .from(campaignStoreItems)
      .where(
        and(
          eq(campaignStoreItems.id, storeItemId),
          eq(campaignStoreItems.campaignId, campaignId),
          eq(campaignStoreItems.isEnabled, true)
        )
      )
      .limit(1);

    if (!storeItem) {
      return NextResponse.json(
        { ok: false, error: "Store item not found or not available" },
        { status: 404 }
      );
    }

    // Get campaign to check starting credits
    const [campaignData] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaignData) {
      return NextResponse.json(
        { ok: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Check if character has enough credits
    // If creditsRemaining is 0 and equipment is empty, use starting credits from campaign
    let currentCredits = character.creditsRemaining || 0;
    const currentEquipment = (character.equipment as any[]) || [];
    
    // Initialize with campaign starting credits if this is the first purchase
    if (currentCredits === 0 && currentEquipment.length === 0) {
      currentCredits = campaignData.startingCredits || 0;
    }

    const totalCost = storeItem.costCredits * quantity;
    if (currentCredits < totalCost) {
      return NextResponse.json(
        { ok: false, error: "Insufficient credits" },
        { status: 400 }
      );
    }

    // Check if item already exists in equipment
    const existingItemIndex = currentEquipment.findIndex(
      (e: any) => e.storeItemId === storeItem.id
    );

    let updatedEquipment;
    let purchasedItem;
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      updatedEquipment = [...currentEquipment];
      updatedEquipment[existingItemIndex] = {
        ...updatedEquipment[existingItemIndex],
        quantity: (updatedEquipment[existingItemIndex].quantity || 1) + quantity,
      };
      purchasedItem = updatedEquipment[existingItemIndex];
    } else {
      // Add new item to equipment
      const newEquipmentItem = {
        storeItemId: storeItem.id,
        sourceType: storeItem.sourceType,
        sourceId: storeItem.sourceId,
        name: storeItem.name,
        itemType: storeItem.itemType,
        costCredits: storeItem.costCredits,
        purchasedAt: new Date().toISOString(),
        equipped: false,
        quantity: quantity,
      };
      updatedEquipment = [...currentEquipment, newEquipmentItem];
      purchasedItem = newEquipmentItem;
    }

    const newCredits = currentCredits - totalCost;

    // Update character
    await db
      .update(campaignCharacters)
      .set({
        equipment: updatedEquipment,
        creditsRemaining: newCredits,
        updatedAt: new Date(),
      })
      .where(eq(campaignCharacters.id, characterId));

    return NextResponse.json({
      ok: true,
      item: purchasedItem,
      creditsRemaining: newCredits,
    });
  } catch (err) {
    console.error("Error purchasing item:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
