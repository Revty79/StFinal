import { NextResponse } from "next/server";
import { pool } from "@/db/client";
import { getSessionUser } from "@/server/session";

const ROLE_ORDER = [
  "admin",
  "privileged",
  "universe_creator",
  "world_developer",
  "world_builder",
  "free",
] as const;

function pickPrimaryRole(roleCodes: string[]): string {
  for (const r of ROLE_ORDER) {
    if (roleCodes.includes(r)) return r;
  }
  return roleCodes[0] ?? "free";
}

// GET /api/admin/users
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const result = await pool.query(`
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.created_at, 
        u.updated_at,
        array_agg(ur.role_code) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      GROUP BY u.id, u.username, u.email, u.created_at, u.updated_at
      ORDER BY u.created_at DESC
    `);

    const users = result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      role: pickPrimaryRole(row.roles.filter((r: string) => r !== null)),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ ok: true, users });
  } catch (err) {
    console.error("Get users error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
