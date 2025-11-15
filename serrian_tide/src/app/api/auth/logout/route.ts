import { NextResponse } from "next/server";
import { destroySession } from "@/server/session";

export async function POST(req: Request) {
  try {
    await destroySession();
    // Use absolute URL with protocol and host for proper redirect
    const { origin } = new URL(req.url);
    return NextResponse.redirect(`${origin}/`, { status: 303 });
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
