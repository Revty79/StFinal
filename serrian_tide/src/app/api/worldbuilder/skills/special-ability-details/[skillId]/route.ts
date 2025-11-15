import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";

// GET /api/worldbuilder/skills/special-ability-details/[skillId]
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
      .from(schema.specialAbilityDetails)
      .where(eq(schema.specialAbilityDetails.skillId, skillId))
      .limit(1);

    return NextResponse.json({ 
      ok: true, 
      details: details.length > 0 ? details[0] : null 
    });
  } catch (err) {
    console.error("Get special ability details error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/worldbuilder/skills/special-ability-details/[skillId]
// Creates or updates special ability details for a skill
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
      .from(schema.specialAbilityDetails)
      .where(eq(schema.specialAbilityDetails.skillId, skillId))
      .limit(1);

    if (existing.length > 0) {
      // Update
      const existingRecord = existing[0];
      if (!existingRecord) {
        return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
      }
      
      await db
        .update(schema.specialAbilityDetails)
        .set({
          abilityType: body.abilityType || null,
          scalingMethod: body.scalingMethod || null,
          prerequisites: body.prerequisites || null,
          scalingDetails: body.scalingDetails || null,
          stage1Tag: body.stage1Tag || null,
          stage1Desc: body.stage1Desc || null,
          stage1Points: body.stage1Points || null,
          stage2Tag: body.stage2Tag || null,
          stage2Desc: body.stage2Desc || null,
          stage2Points: body.stage2Points || null,
          stage3Tag: body.stage3Tag || null,
          stage3Desc: body.stage3Desc || null,
          stage4Tag: body.stage4Tag || null,
          stage4Desc: body.stage4Desc || null,
          finalTag: body.finalTag || null,
          finalDesc: body.finalDesc || null,
          add1Tag: body.add1Tag || null,
          add1Desc: body.add1Desc || null,
          add2Tag: body.add2Tag || null,
          add2Desc: body.add2Desc || null,
          add3Tag: body.add3Tag || null,
          add3Desc: body.add3Desc || null,
          add4Tag: body.add4Tag || null,
          add4Desc: body.add4Desc || null,
          updatedAt: new Date(),
        })
        .where(eq(schema.specialAbilityDetails.id, existingRecord.id));

      return NextResponse.json({ ok: true, id: existingRecord.id });
    } else {
      // Insert
      const id = crypto.randomUUID();
      await db.insert(schema.specialAbilityDetails).values({
        id,
        skillId,
        abilityType: body.abilityType || null,
        scalingMethod: body.scalingMethod || null,
        prerequisites: body.prerequisites || null,
        scalingDetails: body.scalingDetails || null,
        stage1Tag: body.stage1Tag || null,
        stage1Desc: body.stage1Desc || null,
        stage1Points: body.stage1Points || null,
        stage2Tag: body.stage2Tag || null,
        stage2Desc: body.stage2Desc || null,
        stage2Points: body.stage2Points || null,
        stage3Tag: body.stage3Tag || null,
        stage3Desc: body.stage3Desc || null,
        stage4Tag: body.stage4Tag || null,
        stage4Desc: body.stage4Desc || null,
        finalTag: body.finalTag || null,
        finalDesc: body.finalDesc || null,
        add1Tag: body.add1Tag || null,
        add1Desc: body.add1Desc || null,
        add2Tag: body.add2Tag || null,
        add2Desc: body.add2Desc || null,
        add3Tag: body.add3Tag || null,
        add3Desc: body.add3Desc || null,
        add4Tag: body.add4Tag || null,
        add4Desc: body.add4Desc || null,
      });

      return NextResponse.json({ ok: true, id });
    }
  } catch (err) {
    console.error("Save special ability details error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/worldbuilder/skills/special-ability-details/[skillId]
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
      .delete(schema.specialAbilityDetails)
      .where(eq(schema.specialAbilityDetails.skillId, skillId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete special ability details error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
