import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";

// GET /api/worldbuilder/skills/magic-details/[skillId]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { skillId } = await params;

    // Verify skill belongs to user
    const skill = await db
      .select()
      .from(schema.skills)
      .where(and(
        eq(schema.skills.id, skillId),
        eq(schema.skills.createdBy, user.id)
      ))
      .limit(1);

    if (skill.length === 0) {
      return NextResponse.json({ ok: false, error: "SKILL_NOT_FOUND" }, { status: 404 });
    }

    const details = await db
      .select()
      .from(schema.magicTypeDetails)
      .where(eq(schema.magicTypeDetails.skillId, skillId))
      .limit(1);

    return NextResponse.json({ 
      ok: true, 
      details: details.length > 0 ? details[0] : null 
    });
  } catch (err) {
    console.error("Get magic details error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/worldbuilder/skills/magic-details/[skillId]
// Creates or updates magic type details for a skill
export async function POST(
  req: Request,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { skillId } = await params;
    const body = await req.json().catch(() => null) as any;
    
    if (!body) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    // Verify skill belongs to user
    const skill = await db
      .select()
      .from(schema.skills)
      .where(and(
        eq(schema.skills.id, skillId),
        eq(schema.skills.createdBy, user.id)
      ))
      .limit(1);

    if (skill.length === 0) {
      return NextResponse.json({ ok: false, error: "SKILL_NOT_FOUND" }, { status: 404 });
    }

    // Check if details already exist
    const existing = await db
      .select()
      .from(schema.magicTypeDetails)
      .where(eq(schema.magicTypeDetails.skillId, skillId))
      .limit(1);

    if (existing.length > 0) {
      // Update
      const existingRecord = existing[0];
      if (!existingRecord) {
        return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
      }
      
      await db
        .update(schema.magicTypeDetails)
        .set({
          skillName: body.skillName || null,
          tradition: body.tradition || null,
          tier2Path: body.tier2Path || null,
          containersJson: body.containersJson || null,
          modifiersJson: body.modifiersJson || null,
          manaCost: body.manaCost || null,
          castingTime: body.castingTime || null,
          masteryLevel: body.masteryLevel || null,
          notes: body.notes || null,
          flavorLine: body.flavorLine || null,
          updatedAt: new Date(),
        })
        .where(eq(schema.magicTypeDetails.id, existingRecord.id));

      return NextResponse.json({ ok: true, id: existingRecord.id });
    } else {
      // Insert
      const id = crypto.randomUUID();
      await db.insert(schema.magicTypeDetails).values({
        id,
        skillId,
        skillName: body.skillName || null,
        tradition: body.tradition || null,
        tier2Path: body.tier2Path || null,
        containersJson: body.containersJson || null,
        modifiersJson: body.modifiersJson || null,
        manaCost: body.manaCost || null,
        castingTime: body.castingTime || null,
        masteryLevel: body.masteryLevel || null,
        notes: body.notes || null,
        flavorLine: body.flavorLine || null,
      });

      return NextResponse.json({ ok: true, id });
    }
  } catch (err) {
    console.error("Save magic details error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/worldbuilder/skills/magic-details/[skillId]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { skillId } = await params;

    // Verify skill belongs to user
    const skill = await db
      .select()
      .from(schema.skills)
      .where(and(
        eq(schema.skills.id, skillId),
        eq(schema.skills.createdBy, user.id)
      ))
      .limit(1);

    if (skill.length === 0) {
      return NextResponse.json({ ok: false, error: "SKILL_NOT_FOUND" }, { status: 404 });
    }

    await db
      .delete(schema.magicTypeDetails)
      .where(eq(schema.magicTypeDetails.skillId, skillId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete magic details error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
