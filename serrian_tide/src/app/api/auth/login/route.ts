import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth";
import { createSession } from "@/server/session";

// POST /api/auth/login
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { username?: string; password?: string }
      | null;

    if (!body || !body.username || !body.password) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const { username, password } = body;

    // Find user by username
    const rows = await db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        passwordHash: schema.users.passwordHash,
        isActive: schema.users.isActive,
      })
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);

    const user = rows[0];
    if (!user || !user.isActive) {
      return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    // Verify password
    const ok = verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    // Create session (sets cookie)
    await createSession(user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
