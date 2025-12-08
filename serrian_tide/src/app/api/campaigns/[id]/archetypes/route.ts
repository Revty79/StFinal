import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { campaignArchetypes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = id;

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
    console.error('GET /api/campaigns/[id]/archetypes error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch archetypes' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = id;
    const body = await req.json();

    const { name, description, attributes, skills, spellcraftGuidance, talismanismGuidance, faithGuidance, psonicsGuidance, bardicGuidance } = body;

    if (!name) {
      return NextResponse.json(
        { ok: false, error: 'Archetype name is required' },
        { status: 400 }
      );
    }

    const newArchetype = await db
      .insert(campaignArchetypes)
      .values({
        id: crypto.randomUUID(),
        campaignId,
        name,
        description: description || null,
        attributes: attributes || {},
        skills: skills || [],
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
    console.error('POST /api/campaigns/[id]/archetypes error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create archetype';
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 });
  }
}
