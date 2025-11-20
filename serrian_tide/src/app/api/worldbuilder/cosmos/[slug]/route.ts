import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { cosmos } from '@/db/schema';
import { getSessionUser } from '@/server/session';
import { eq, and } from 'drizzle-orm';

type RouteContext = {
  params: Promise<{ slug: string }>;
};

// GET /api/worldbuilder/cosmos/[slug] - Get single cosmos
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    const { slug } = await context.params;

    const result = await db
      .select()
      .from(cosmos)
      .where(and(eq(cosmos.createdBy, userId), eq(cosmos.slug, slug)))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Cosmos not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('GET /api/worldbuilder/cosmos/[slug] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cosmos' },
      { status: 500 }
    );
  }
}

// PUT /api/worldbuilder/cosmos/[slug] - Update cosmos
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    const { slug } = await context.params;
    const body = await req.json();

    // Check if cosmos exists and belongs to user
    const existing = await db
      .select()
      .from(cosmos)
      .where(and(eq(cosmos.createdBy, userId), eq(cosmos.slug, slug)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Cosmos not found' }, { status: 404 });
    }

    // Update only provided fields
    const updates: any = {
      ...body,
      updatedAt: new Date(),
    };

    // Don't allow updating id, createdBy, or slug
    delete updates.id;
    delete updates.createdBy;
    delete updates.slug;
    delete updates.createdAt;

    await db
      .update(cosmos)
      .set(updates)
      .where(and(eq(cosmos.createdBy, userId), eq(cosmos.slug, slug)));

    // Fetch and return updated cosmos
    const updated = await db
      .select()
      .from(cosmos)
      .where(and(eq(cosmos.createdBy, userId), eq(cosmos.slug, slug)))
      .limit(1);

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT /api/worldbuilder/cosmos/[slug] error:', error);
    return NextResponse.json(
      { error: 'Failed to update cosmos' },
      { status: 500 }
    );
  }
}

// DELETE /api/worldbuilder/cosmos/[slug] - Delete cosmos
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    const { slug } = await context.params;

    // Check if cosmos exists and belongs to user
    const existing = await db
      .select()
      .from(cosmos)
      .where(and(eq(cosmos.createdBy, userId), eq(cosmos.slug, slug)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Cosmos not found' }, { status: 404 });
    }

    await db
      .delete(cosmos)
      .where(and(eq(cosmos.createdBy, userId), eq(cosmos.slug, slug)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/worldbuilder/cosmos/[slug] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete cosmos' },
      { status: 500 }
    );
  }
}
