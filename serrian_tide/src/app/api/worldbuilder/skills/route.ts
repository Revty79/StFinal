import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and, or, inArray, sql } from "drizzle-orm";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";

// GET /api/worldbuilder/skills
// Query params: ?tier=1&attribute=STR&type=special%20ability&is_special_ability=true
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tier = searchParams.get('tier');
    const attribute = searchParams.get('attribute');
    const type = searchParams.get('type');
    const isSpecialAbility = searchParams.get('is_special_ability') === 'true';
    
    let query = db
      .select()
      .from(schema.skills)
      .where(eq(schema.skills.createdBy, user.id));

    // Build filters
    const conditions: any[] = [eq(schema.skills.createdBy, user.id)];
    
    if (tier) {
      const tierNum = tier === 'N/A' ? null : parseInt(tier);
      if (tierNum === null) {
        conditions.push(sql`${schema.skills.tier} IS NULL`);
      } else {
        conditions.push(eq(schema.skills.tier, tierNum));
      }
    }
    
    if (attribute) {
      // Match primary or secondary attribute
      conditions.push(
        or(
          eq(schema.skills.primaryAttribute, attribute),
          eq(schema.skills.secondaryAttribute, attribute)
        )
      );
    }
    
    if (type) {
      conditions.push(eq(schema.skills.type, type));
    }
    
    if (isSpecialAbility) {
      conditions.push(eq(schema.skills.type, 'special ability'));
    }

    const skills = await db
      .select()
      .from(schema.skills)
      .where(and(...conditions))
      .orderBy(schema.skills.name);

    return NextResponse.json({ ok: true, skills });
  } catch (err) {
    console.error("Get skills error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/worldbuilder/skills
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
    const tierValue = body.tier === null || body.tier === 'N/A' ? null : parseInt(body.tier);

    const newSkill = {
      id,
      createdBy: user.id,
      name: body.name,
      type: body.type || 'standard',
      tier: tierValue,
      primaryAttribute: body.primaryAttribute || 'NA',
      secondaryAttribute: body.secondaryAttribute || 'NA',
      definition: body.definition || null,
      parentId: body.parentId || null,
      parent2Id: body.parent2Id || null,
      parent3Id: body.parent3Id || null,
      isFree: body.isFree !== undefined ? body.isFree : true,
      isPublished: body.isPublished !== undefined ? body.isPublished : false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.skills).values(newSkill);

    return NextResponse.json({ ok: true, id, skill: newSkill });
  } catch (err) {
    console.error("Create skill error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
