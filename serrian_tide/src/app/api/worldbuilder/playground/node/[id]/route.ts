import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { canUsePlayground, normalizeTags } from "@/lib/playground";

type UpdateBody = {
  name?: string;
  summary?: string | null;
  tags?: unknown;
  markdown?: string | null;
  sortOrder?: number;
  isPublished?: boolean;
};

async function getAccessibleNode(id: string, userId: string, role: string) {
  const rows =
    role === "admin"
      ? await db
          .select()
          .from(schema.playgroundNodes)
          .where(eq(schema.playgroundNodes.id, id))
          .limit(1)
      : await db
          .select()
          .from(schema.playgroundNodes)
          .where(
            and(
              eq(schema.playgroundNodes.id, id),
              eq(schema.playgroundNodes.createdBy, userId)
            )
          )
          .limit(1);

  return rows[0] ?? null;
}

// GET /api/worldbuilder/playground/node/[id]
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!canUsePlayground(user.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = await context.params;
    const node = await getAccessibleNode(id, user.id, user.role);
    if (!node) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, node });
  } catch (err) {
    console.error("Get playground node error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// PUT /api/worldbuilder/playground/node/[id]
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!canUsePlayground(user.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await getAccessibleNode(id, user.id, user.role);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const body = (await req.json().catch(() => null)) as UpdateBody | null;
    if (!body) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const updates: Partial<typeof schema.playgroundNodes.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      const nextName = body.name.trim();
      if (!nextName) {
        return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
      }
      updates.name = nextName;
    }

    if (body.summary !== undefined) {
      updates.summary = body.summary ? body.summary.trim() : null;
    }

    if (body.tags !== undefined) {
      updates.tags = normalizeTags(body.tags);
    }

    if (body.markdown !== undefined) {
      updates.markdown = body.markdown ?? "";
    }

    if (body.sortOrder !== undefined) {
      if (!Number.isInteger(body.sortOrder) || body.sortOrder < 0) {
        return NextResponse.json({ ok: false, error: "INVALID_SORT_ORDER" }, { status: 400 });
      }
      updates.sortOrder = body.sortOrder;
    }

    if (body.isPublished !== undefined) {
      updates.isPublished = Boolean(body.isPublished);
    }

    await db
      .update(schema.playgroundNodes)
      .set(updates)
      .where(eq(schema.playgroundNodes.id, id));

    const updated = await getAccessibleNode(id, user.id, user.role);
    return NextResponse.json({ ok: true, node: updated });
  } catch (err) {
    console.error("Update playground node error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/worldbuilder/playground/node/[id]
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!canUsePlayground(user.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await getAccessibleNode(id, user.id, user.role);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    await db.delete(schema.playgroundNodes).where(eq(schema.playgroundNodes.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete playground node error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
