import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and, or } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

// GET /api/worldbuilder/skills/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;

    // Admins can view all, users can view their own + free content
    const whereClause = user.role === 'admin'
      ? eq(schema.skills.id, id)
      : and(
          eq(schema.skills.id, id),
          or(
            eq(schema.skills.createdBy, user.id),
            eq(schema.skills.isFree, true)
          )
        );

    const skill = await db
      .select()
      .from(schema.skills)
      .where(whereClause)
      .limit(1);

    if (skill.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const skillData = skill[0]!;
    const canEdit = user.role === 'admin' || skillData.createdBy === user.id;

    return NextResponse.json({ ok: true, skill: skillData, canEdit });
  } catch (err) {
    console.error("Get skill error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// PUT /api/worldbuilder/skills/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null) as any;
    
    if (!body) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const tierValue = body.tier === null || body.tier === 'N/A' ? null : parseInt(body.tier);

    await db
      .update(schema.skills)
      .set({
        name: body.name,
        type: body.type,
        tier: tierValue,
        primaryAttribute: body.primaryAttribute,
        secondaryAttribute: body.secondaryAttribute,
        definition: body.definition || null,
        parentId: body.parentId || null,
        parent2Id: body.parent2Id || null,
        parent3Id: body.parent3Id || null,
        isFree: body.isFree,
        isPublished: body.isPublished,
        updatedAt: new Date(),
      })
      .where(
        user.role === 'admin'
          ? eq(schema.skills.id, id)
          : and(
              eq(schema.skills.id, id),
              eq(schema.skills.createdBy, user.id)
            )
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update skill error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/worldbuilder/skills/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;

    await db
      .delete(schema.skills)
      .where(
        user.role === 'admin'
          ? eq(schema.skills.id, id)
          : and(
              eq(schema.skills.id, id),
              eq(schema.skills.createdBy, user.id)
            )
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete skill error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
