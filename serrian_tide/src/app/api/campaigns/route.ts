import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";

// GET /api/campaigns - Get all campaigns for current user
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Admins can see all campaigns, others see only their own
    const campaigns = user.role === 'admin'
      ? await db
          .select()
          .from(schema.campaigns)
          .orderBy(schema.campaigns.name)
      : await db
          .select()
          .from(schema.campaigns)
          .where(eq(schema.campaigns.createdBy, user.id))
          .orderBy(schema.campaigns.name);

    return NextResponse.json({ ok: true, campaigns });
  } catch (err) {
    console.error("Get campaigns error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/campaigns - Create new campaign
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as any;
    if (!body || !body.name) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const id = crypto.randomUUID();

    const newCampaign = {
      id,
      createdBy: user.id,
      name: body.name,
      genre: body.genre || null,
      attributePoints: body.attributePoints ?? 150,
      skillPoints: body.skillPoints ?? 50,
      maxPointsInSkill: body.maxPointsInSkill || null,
      pointsNeededForNextTier: body.pointsNeededForNextTier || null,
      maxAllowedInTier: body.maxAllowedInTier || null,
      tier1Enabled: body.tier1Enabled ?? false,
      tier2Enabled: body.tier2Enabled ?? false,
      tier3Enabled: body.tier3Enabled ?? false,
      spellcraftEnabled: body.spellcraftEnabled ?? false,
      talismanismEnabled: body.talismanismEnabled ?? false,
      faithEnabled: body.faithEnabled ?? false,
      psyonicsEnabled: body.psyonicsEnabled ?? false,
      bardicResonancesEnabled: body.bardicResonancesEnabled ?? false,
      specialAbilitiesEnabled: body.specialAbilitiesEnabled ?? false,
      allowedRaces: body.allowedRaces || [],
      startingCredits: body.startingCredits ?? 0,
    };

    await db.insert(schema.campaigns).values(newCampaign);

    return NextResponse.json({ ok: true, id, campaign: newCampaign });
  } catch (err) {
    console.error("Create campaign error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
