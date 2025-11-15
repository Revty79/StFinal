import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/server/session";

// GET /api/profile/preferences
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const prefs = await db
      .select()
      .from(schema.userPreferences)
      .where(eq(schema.userPreferences.userId, user.id))
      .limit(1);

    const pref = prefs[0];
    
    if (!pref) {
      // Return defaults if no preferences exist
      return NextResponse.json({
        ok: true,
        preferences: {
          theme: 'void',
          backgroundImage: 'nebula.png',
          gearImage: null,
        }
      });
    }

    return NextResponse.json({
      ok: true,
      preferences: {
        theme: pref.theme,
        backgroundImage: pref.backgroundImage,
        gearImage: pref.gearImage,
      }
    });
  } catch (err) {
    console.error("Get preferences error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/profile/preferences
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as
      | { theme?: string; backgroundImage?: string; gearImage?: string | null }
      | null;

    if (!body) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const { theme, backgroundImage, gearImage } = body;

    // Check if preferences exist
    const existing = await db
      .select()
      .from(schema.userPreferences)
      .where(eq(schema.userPreferences.userId, user.id))
      .limit(1);

    const existingPref = existing[0];

    if (!existingPref) {
      // Insert new preferences
      await db.insert(schema.userPreferences).values({
        userId: user.id,
        theme: theme || 'void',
        backgroundImage: backgroundImage || 'nebula.png',
        gearImage: gearImage || null,
      });
    } else {
      // Update existing preferences
      await db
        .update(schema.userPreferences)
        .set({
          theme: theme || existingPref.theme,
          backgroundImage: backgroundImage || existingPref.backgroundImage,
          gearImage: gearImage !== undefined ? gearImage : existingPref.gearImage,
          updatedAt: new Date(),
        })
        .where(eq(schema.userPreferences.userId, user.id));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Save preferences error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
