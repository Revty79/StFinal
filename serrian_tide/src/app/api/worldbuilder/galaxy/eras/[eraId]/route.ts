import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { canUseGalaxy, getAccessibleEra } from "@/lib/galaxy/server";

// DELETE /api/worldbuilder/galaxy/eras/[eraId]
export async function DELETE(
  req: Request,
  context: { params: Promise<{ eraId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!canUseGalaxy(user.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const { eraId } = await context.params;
    const existing = await getAccessibleEra(user, eraId);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    await db.delete(schema.galaxyEras).where(eq(schema.galaxyEras.id, eraId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete galaxy era error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
