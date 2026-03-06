import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { campaignArchetypes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

type CampaignAccess = {
  isAdmin: boolean;
  isGod: boolean;
  isPlayer: boolean;
};

async function resolveCampaignAccess(
  campaignId: string,
  userId: string,
  role: string
): Promise<CampaignAccess | null> {
  const [campaign] = await db
    .select({
      id: schema.campaigns.id,
      createdBy: schema.campaigns.createdBy,
    })
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, campaignId))
    .limit(1);

  if (!campaign) return null;

  const isAdmin = role === "admin";
  const isGod = campaign.createdBy === userId;

  if (isAdmin || isGod) {
    return { isAdmin, isGod, isPlayer: false };
  }

  const [playerRecord] = await db
    .select({ id: schema.campaignPlayers.id })
    .from(schema.campaignPlayers)
    .where(
      and(
        eq(schema.campaignPlayers.campaignId, campaignId),
        eq(schema.campaignPlayers.userId, userId)
      )
    )
    .limit(1);

  return { isAdmin, isGod, isPlayer: !!playerRecord };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  void request;
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;
    const campaignId = id;
    const access = await resolveCampaignAccess(campaignId, user.id, user.role);

    if (!access) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    if (!access.isAdmin && !access.isGod && !access.isPlayer) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const archetypes = await db
      .select()
      .from(campaignArchetypes)
      .where(eq(campaignArchetypes.campaignId, campaignId));

    return NextResponse.json({
      ok: true,
      archetypes: archetypes.map((arch: any) => ({
        id: arch.id,
        name: arch.name,
        description: arch.description,
        attributes: arch.attributes,
        skills: arch.skills,
        spellcraftGuidance: arch.spellcraftGuidance,
        talismanismGuidance: arch.talismanismGuidance,
        faithGuidance: arch.faithGuidance,
        psonicsGuidance: arch.psonicsGuidance,
        bardicGuidance: arch.bardicGuidance,
      })),
    });
  } catch (error) {
    console.error("GET /api/campaigns/[id]/archetypes error:", error);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;
    const campaignId = id;
    const access = await resolveCampaignAccess(campaignId, user.id, user.role);

    if (!access) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    if (!access.isAdmin && !access.isGod) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as
      | {
          name?: string;
          description?: string | null;
          attributes?: unknown;
          skills?: unknown;
          spellcraftGuidance?: string | null;
          talismanismGuidance?: string | null;
          faithGuidance?: string | null;
          psonicsGuidance?: string | null;
          bardicGuidance?: string | null;
        }
      | null;

    if (!body) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const {
      name,
      description,
      attributes,
      skills,
      spellcraftGuidance,
      talismanismGuidance,
      faithGuidance,
      psonicsGuidance,
      bardicGuidance,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { ok: false, error: "MISSING_OR_INVALID_FIELDS" },
        { status: 400 }
      );
    }

    const newArchetype = await db
      .insert(campaignArchetypes)
      .values({
        id: crypto.randomUUID(),
        campaignId,
        name: name.trim(),
        description: description || null,
        attributes: (attributes ?? {}) as object,
        skills: (skills ?? []) as Array<{ skillId: string; skillName: string; points: number }>,
        spellcraftGuidance: spellcraftGuidance || null,
        talismanismGuidance: talismanismGuidance || null,
        faithGuidance: faithGuidance || null,
        psonicsGuidance: psonicsGuidance || null,
        bardicGuidance: bardicGuidance || null,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      archetype: newArchetype[0],
    });
  } catch (error) {
    console.error("POST /api/campaigns/[id]/archetypes error:", error);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
