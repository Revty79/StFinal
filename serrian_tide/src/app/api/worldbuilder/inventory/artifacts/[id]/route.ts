import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, artifact: null });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await request.json();
  return NextResponse.json({ ok: true, artifact: { ...data, id } });
}

export async function DELETE() {
  return NextResponse.json({ ok: true });
}
