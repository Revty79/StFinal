import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, artifact: null });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const data = await request.json();
  return NextResponse.json({ ok: true, artifact: { ...data, id: params.id } });
}

export async function DELETE() {
  return NextResponse.json({ ok: true });
}
