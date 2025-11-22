import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function GET() {
  return NextResponse.json({ ok: true, artifacts: [] });
}

export async function POST(request: Request) {
  const data = await request.json();
  const artifact = { ...data, id: randomUUID() };
  return NextResponse.json({ ok: true, artifact });
}
