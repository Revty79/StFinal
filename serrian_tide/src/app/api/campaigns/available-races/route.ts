import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, or } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

// GET /api/campaigns/available-races
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Fetch races that are:
    // 1. Free (is_free = true), OR
    // 2. Created by the current user
    // TODO: Add purchased races when purchase system is implemented
    const races = await db
      .select({
        id: schema.races.id,
        name: schema.races.name,
        tagline: schema.races.tagline,
      })
      .from(schema.races)
      .where(
        or(
          eq(schema.races.isFree, true),
          eq(schema.races.createdBy, user.id)
        )
      )
      .orderBy(schema.races.name);

    return NextResponse.json({ ok: true, races });
  } catch (err) {
    console.error("Fetch available races error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
