import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { campaignArchetypes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; archetypeId: string }> }
) {
  try {
    const { id: campaignId, archetypeId } = await params;
    const body = await req.json();

    const { name, description, attributes, skills, spellcraftGuidance, talismanismGuidance, faithGuidance, psonicsGuidance, bardicGuidance } = body;

    const updated = await db
      .update(campaignArchetypes)
      .set({
        name,
        description: description || null,
        attributes: attributes || {},
        skills: skills || [],
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
    console.error('PUT /api/campaigns/[id]/archetypes/[archetypeId] error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update archetype' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; archetypeId: string }> }
) {
  try {
    const { id: campaignId, archetypeId } = await params;

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
    console.error('DELETE /api/campaigns/[id]/archetypes/[archetypeId] error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to delete archetype' }, { status: 500 });
  }
}
