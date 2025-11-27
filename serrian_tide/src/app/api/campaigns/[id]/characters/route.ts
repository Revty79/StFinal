import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";

// POST /api/campaigns/[id]/characters - Add character to player
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

    if (!body || !body.playerId || !body.name) {
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

    const id = crypto.randomUUID();

    await db.insert(schema.campaignCharacters).values({
      id,
      campaignPlayerId: body.playerId,
      name: body.name,
    });

    return NextResponse.json({
      ok: true,
      character: {
        id,
        name: body.name,
        playerId: body.playerId,
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
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const campaignId = params.id;
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
  { params }: { params: { id: string } }
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

    await db
      .delete(schema.campaignCharacters)
      .where(eq(schema.campaignCharacters.id, characterId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Remove character error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
