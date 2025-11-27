import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

// GET /api/users/active - Get all active users (for adding to campaigns)
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Get all active users
    const users = await db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        email: schema.users.email,
      })
      .from(schema.users)
      .where(eq(schema.users.isActive, true))
      .orderBy(schema.users.username);

    return NextResponse.json({ ok: true, users });
  } catch (err) {
    console.error("Get active users error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
