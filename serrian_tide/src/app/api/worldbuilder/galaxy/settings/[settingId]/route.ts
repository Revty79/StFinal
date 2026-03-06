import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { canUseGalaxy, getAccessibleSetting } from "@/lib/galaxy/server";

// DELETE /api/worldbuilder/galaxy/settings/[settingId]
export async function DELETE(
  req: Request,
  context: { params: Promise<{ settingId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!canUseGalaxy(user.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const { settingId } = await context.params;
    const existing = await getAccessibleSetting(user, settingId);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    await db.delete(schema.galaxySettings).where(eq(schema.galaxySettings.id, settingId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete galaxy setting error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
