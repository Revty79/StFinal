import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, and, or, inArray } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

// GET /api/worldbuilder/skills/available-parents
// Query params: ?tier=2&primaryAttribute=STR&secondaryAttribute=DEX
// Returns tier 1 skills that match either primaryAttribute or secondaryAttribute
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tier = searchParams.get('tier');
    const primaryAttribute = searchParams.get('primaryAttribute');
    const secondaryAttribute = searchParams.get('secondaryAttribute');

    if (!tier) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST: tier required" }, { status: 400 });
    }

    const childTier = parseInt(tier);
    const parentTier = childTier - 1;

    if (parentTier < 1) {
      // Tier 1 skills have no parents
      return NextResponse.json({ ok: true, skills: [] });
    }

    // Base conditions: must be user's skills and correct parent tier
    const conditions: any[] = [
      eq(schema.skills.createdBy, user.id),
      eq(schema.skills.tier, parentTier)
    ];

    // If attributes provided, filter by matching primary or secondary attribute
    if (primaryAttribute || secondaryAttribute) {
      const attributeConditions: any[] = [];
      
      if (primaryAttribute && primaryAttribute !== 'NA') {
        attributeConditions.push(
          or(
            eq(schema.skills.primaryAttribute, primaryAttribute),
            eq(schema.skills.secondaryAttribute, primaryAttribute)
          )
        );
      }
      
      if (secondaryAttribute && secondaryAttribute !== 'NA') {
        attributeConditions.push(
          or(
            eq(schema.skills.primaryAttribute, secondaryAttribute),
            eq(schema.skills.secondaryAttribute, secondaryAttribute)
          )
        );
      }

      if (attributeConditions.length > 0) {
        conditions.push(or(...attributeConditions));
      }
    }

    const skills = await db
      .select()
      .from(schema.skills)
      .where(and(...conditions))
      .orderBy(schema.skills.name);

    return NextResponse.json({ ok: true, skills });
  } catch (err) {
    console.error("Get available parents error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
