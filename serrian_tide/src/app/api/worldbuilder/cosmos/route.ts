import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { cosmos } from '@/db/schema';
import { getSessionUser } from '@/server/session';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// GET /api/worldbuilder/cosmos - List all cosmos for current user
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    const userCosmos = await db
      .select()
      .from(cosmos)
      .where(eq(cosmos.createdBy, userId))
      .orderBy(cosmos.createdAt);

    return NextResponse.json(userCosmos);
  } catch (error) {
    console.error('GET /api/worldbuilder/cosmos error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cosmos' },
      { status: 500 }
    );
  }
}

// POST /api/worldbuilder/cosmos - Create new cosmos
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    const body = await req.json();
    const { name, shortPitch, slug } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists for this user
    const existing = await db
      .select()
      .from(cosmos)
      .where(and(eq(cosmos.createdBy, userId), eq(cosmos.slug, slug)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A cosmos with this slug already exists' },
        { status: 409 }
      );
    }

    const newCosmos = {
      id: randomUUID(),
      createdBy: userId,
      slug,
      name,
      shortPitch: shortPitch || null,
      status: 'draft',
      description: null,
      originStory: null,
      cosmicOperationNotes: null,
      designerNotes: null,
      existenceOrigin: null,
      energyConsciousnessFramework: null,
      cosmicConstants: null,
      realityInteractionFramework: null,
      planeTravelPossible: true,
      cosmicCalendarName: null,
      cyclesEpochsAges: null,
      timeFlowRules: null,
      majorCosmicEvents: null,
      isFree: true,
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(cosmos).values(newCosmos);

    return NextResponse.json(newCosmos, { status: 201 });
  } catch (error) {
    console.error('POST /api/worldbuilder/cosmos error:', error);
    return NextResponse.json(
      { error: 'Failed to create cosmos' },
      { status: 500 }
    );
  }
}
