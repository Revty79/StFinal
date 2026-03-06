import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { canUseGalaxy, getEditableMarker, markerExists } from "@/lib/galaxy/server";

// DELETE /api/worldbuilder/galaxy/markers/[markerId]
export async function DELETE(
  req: Request,
  context: { params: Promise<{ markerId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!canUseGalaxy(user.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const { markerId } = await context.params;
    const existing = await getEditableMarker(user, markerId);
    if (!existing) {
      const exists = await markerExists(markerId);
      if (!exists) {
        return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    await db.delete(schema.galaxyMarkers).where(eq(schema.galaxyMarkers.id, markerId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete galaxy marker error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
