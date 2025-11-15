import { cookies } from "next/headers";
import { db, schema } from "@/db/client";
import { eq, and, inArray, sql } from "drizzle-orm";
import { newSessionId } from "@/lib/auth";

const COOKIE_NAME = "st_sess";
const SESSION_TTL_DAYS = 14;

// role precedence (leftmost = highest)
const ROLE_ORDER = ["admin", "privileged", "universe_creator", "world_developer", "world_builder", "free"] as const;

function pickPrimaryRole(roleCodes: string[]): string {
  // choose the highest-precedence role present
  for (const r of ROLE_ORDER) {
    if (roleCodes.includes(r)) return r;
  }
  // fallback to first or free
  return roleCodes[0] ?? "free";
}

export async function createSession(userId: string) {
  const id = newSessionId();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  // insert session row
  await db.insert(schema.sessions).values({
    id,
    userId,
    createdAt: now,
    expiresAt: expires,
  });

  // set cookie
  const c = await cookies();
  c.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const c = await cookies();
  const sid = c.get(COOKIE_NAME)?.value;
  if (sid) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sid));
    c.set(COOKIE_NAME, "", { path: "/", expires: new Date(0) });
  }
}

export async function getSessionUser(): Promise<{
  id: string;
  username: string;
  email: string | null;
  role: string; // primary role
} | null> {
  const c = await cookies();
  const sid = c.get(COOKIE_NAME)?.value;
  if (!sid) return null;

  // fetch session & user (and ensure not expired)
  const now = new Date();
  const sessionRows = await db
    .select({
      sessionId: schema.sessions.id,
      userId: schema.sessions.userId,
      expiresAt: schema.sessions.expiresAt,
    })
    .from(schema.sessions)
    .where(and(eq(schema.sessions.id, sid), sql`${schema.sessions.expiresAt} > ${now}`))
    .limit(1);

  const s = sessionRows[0];
  if (!s) return null;

  const userRows = await db
    .select({
      id: schema.users.id,
      username: schema.users.username,
      email: schema.users.email,
    })
    .from(schema.users)
    .where(eq(schema.users.id, s.userId))
    .limit(1);

  const u = userRows[0];
  if (!u) return null;

  // collect roles for this user
  const roleRows = await db
    .select({ roleCode: schema.userRoles.roleCode })
    .from(schema.userRoles)
    .where(eq(schema.userRoles.userId, u.id));

  const roles = roleRows.map(r => r.roleCode);
  const primary = pickPrimaryRole(roles);

  return { id: u.id, username: u.username, email: u.email, role: primary };
}
