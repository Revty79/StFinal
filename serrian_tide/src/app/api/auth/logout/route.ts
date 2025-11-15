import { NextResponse } from "next/server";
import { destroySession } from "@/server/session";

export async function POST(req: Request) {
  try {
    await destroySession();
    const url = new URL('/', req.url);
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
