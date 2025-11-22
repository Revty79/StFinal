import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function GET() {
  return NextResponse.json({ ok: true, companions: [] });
}

export async function POST(request: Request) {
  const data = await request.json();
  const companion = { ...data, id: randomUUID() };
  return NextResponse.json({ ok: true, companion });
}
