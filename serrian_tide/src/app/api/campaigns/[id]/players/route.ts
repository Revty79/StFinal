import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";

// POST /api/campaigns/[id]/players - Add player to campaign
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const campaignId = params.id;
    const body = await req.json().catch(() => null) as any;

    if (!body || !body.userId) {
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

    // Check if player already exists
    const [existing] = await db
      .select()
      .from(schema.campaignPlayers)
      .where(
        eq(schema.campaignPlayers.campaignId, campaignId) &&
        eq(schema.campaignPlayers.userId, body.userId)
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ ok: false, error: "ALREADY_EXISTS" }, { status: 409 });
    }

    const id = crypto.randomUUID();

    await db.insert(schema.campaignPlayers).values({
      id,
      campaignId,
      userId: body.userId,
    });

    // Get user info
    const [playerUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, body.userId))
      .limit(1);

    return NextResponse.json({
      ok: true,
      player: {
        id,
        userId: body.userId,
        userName: playerUser?.username || "Unknown",
        characters: [],
      },
    });
  } catch (err) {
    console.error("Add player error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id]/players/[playerId] - Remove player from campaign
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");

    if (!playerId) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const campaignId = params.id;

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

    // Delete player (cascades to characters)
    await db
      .delete(schema.campaignPlayers)
      .where(eq(schema.campaignPlayers.id, playerId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Remove player error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
