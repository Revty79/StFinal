import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/session";

// GET /api/profile/me
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      }
    });
  } catch (err) {
    console.error("Get profile error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
