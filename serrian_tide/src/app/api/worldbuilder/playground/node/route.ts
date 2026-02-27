import crypto from "crypto";
import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSessionUser } from "@/server/session";
import {
  canUsePlayground,
  getAllowedChildTypes,
  isPlaygroundNodeType,
} from "@/lib/playground";

// POST /api/worldbuilder/playground/node
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!canUsePlayground(user.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as
      | { parentId?: string | null; type?: string; name?: string }
      | null;

    if (!body || typeof body.type !== "string" || typeof body.name !== "string") {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const type = body.type.trim().toLowerCase();
    const name = body.name.trim();
    const parentId = body.parentId?.trim() || null;

    if (!isPlaygroundNodeType(type) || name.length === 0) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    let parentType: string | null = null;
    if (parentId) {
      const parentRows =
        user.role === "admin"
          ? await db
              .select({ id: schema.playgroundNodes.id, type: schema.playgroundNodes.type })
              .from(schema.playgroundNodes)
              .where(eq(schema.playgroundNodes.id, parentId))
              .limit(1)
          : await db
              .select({ id: schema.playgroundNodes.id, type: schema.playgroundNodes.type })
              .from(schema.playgroundNodes)
              .where(
                and(
                  eq(schema.playgroundNodes.id, parentId),
                  eq(schema.playgroundNodes.createdBy, user.id)
                )
              )
              .limit(1);

      const parent = parentRows[0];
      if (!parent) {
        return NextResponse.json({ ok: false, error: "PARENT_NOT_FOUND" }, { status: 404 });
      }

      parentType = parent.type;
    }

    const allowedChildren = getAllowedChildTypes(parentType);
    if (!allowedChildren.includes(type)) {
      return NextResponse.json(
        { ok: false, error: "INVALID_PARENT_CHILD_RELATIONSHIP" },
        { status: 400 }
      );
    }

    const siblingRows = parentId
      ? await db
          .select({ sortOrder: schema.playgroundNodes.sortOrder })
          .from(schema.playgroundNodes)
          .where(eq(schema.playgroundNodes.parentId, parentId))
          .orderBy(desc(schema.playgroundNodes.sortOrder))
          .limit(1)
      : await db
          .select({ sortOrder: schema.playgroundNodes.sortOrder })
          .from(schema.playgroundNodes)
          .where(isNull(schema.playgroundNodes.parentId))
          .orderBy(desc(schema.playgroundNodes.sortOrder))
          .limit(1);

    const nextSortOrder = (siblingRows[0]?.sortOrder ?? -1) + 1;
    const id = crypto.randomUUID();
    const now = new Date();

    const node = {
      id,
      createdBy: user.id,
      type,
      parentId,
      sortOrder: nextSortOrder,
      name,
      summary: null,
      tags: [],
      markdown: type === "page" ? "" : null,
      meta: null,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(schema.playgroundNodes).values(node);

    return NextResponse.json({ ok: true, node });
  } catch (err) {
    console.error("Create playground node error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
