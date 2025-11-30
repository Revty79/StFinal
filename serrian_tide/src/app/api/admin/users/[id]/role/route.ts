import { NextResponse } from "next/server";
import { pool } from "@/db/client";
import { getSessionUser } from "@/server/session";

// PATCH /api/admin/users/[id]/role
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null) as any;
    
    if (!body || !body.role) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const validRoles = ["admin", "privileged", "universe_creator", "world_developer", "world_builder", "free"];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json({ ok: false, error: "INVALID_ROLE" }, { status: 400 });
    }

    // Prevent admin from demoting themselves
    if (id === user.id && body.role !== "admin") {
      return NextResponse.json({ ok: false, error: "CANNOT_DEMOTE_SELF" }, { status: 400 });
    }

    // Update user role
    await pool.query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2`,
      [body.role, id]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update user role error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
