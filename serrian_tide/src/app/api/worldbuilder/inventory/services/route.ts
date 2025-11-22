import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function GET() {
  return NextResponse.json({ ok: true, services: [] });
}

export async function POST(request: Request) {
  const data = await request.json();
  const service = { ...data, id: randomUUID() };
  return NextResponse.json({ ok: true, service });
}
