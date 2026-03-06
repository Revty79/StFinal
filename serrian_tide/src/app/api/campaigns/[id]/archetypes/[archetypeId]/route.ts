import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { campaignArchetypes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

async function resolveCampaignAccess(
  campaignId: string,
  userId: string,
  role: string
): Promise<{ isAdmin: boolean; isGod: boolean } | null> {
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
  return { isAdmin, isGod };
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; archetypeId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id: campaignId, archetypeId } = await params;
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

    const updated = await db
      .update(campaignArchetypes)
      .set({
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        description: description || null,
        attributes: (attributes ?? {}) as object,
        skills: (skills ?? []) as Array<{ skillId: string; skillName: string; points: number }>,
        spellcraftGuidance: spellcraftGuidance || null,
        talismanismGuidance: talismanismGuidance || null,
        faithGuidance: faithGuidance || null,
        psonicsGuidance: psonicsGuidance || null,
        bardicGuidance: bardicGuidance || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(campaignArchetypes.id, archetypeId),
          eq(campaignArchetypes.campaignId, campaignId)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Archetype not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      archetype: updated[0],
    });
  } catch (error) {
    console.error("PUT /api/campaigns/[id]/archetypes/[archetypeId] error:", error);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; archetypeId: string }> }
) {
  void request;
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id: campaignId, archetypeId } = await params;
    const access = await resolveCampaignAccess(campaignId, user.id, user.role);

    if (!access) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    if (!access.isAdmin && !access.isGod) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const deleted = await db
      .delete(campaignArchetypes)
      .where(
        and(
          eq(campaignArchetypes.id, archetypeId),
          eq(campaignArchetypes.campaignId, campaignId)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Archetype not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/campaigns/[id]/archetypes/[archetypeId] error:", error);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
