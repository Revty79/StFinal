import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSessionUser } from "@/server/session";
import {
  canUsePlayground,
  normalizeToolboxLinks,
  PLAYGROUND_TOOLBOX_TYPES,
} from "@/lib/playground";

type LinksResponse = Record<(typeof PLAYGROUND_TOOLBOX_TYPES)[number], string[]>;

function emptyLinks(): LinksResponse {
  return {
    race: [],
    creature: [],
    npc: [],
    calendar: [],
  };
}

async function getAccessibleSettingNode(id: string, userId: string, role: string) {
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

  const node = rows[0];
  if (!node) return null;
  if (node.type !== "setting") return "NOT_SETTING" as const;
  return node;
}

// GET /api/worldbuilder/playground/node/[id]/toolbox-links
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
    const node = await getAccessibleSettingNode(id, user.id, user.role);

    if (!node) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    if (node === "NOT_SETTING") {
      return NextResponse.json({ ok: false, error: "NOT_A_SETTING_NODE" }, { status: 400 });
    }

    const rows = await db
      .select()
      .from(schema.playgroundToolboxLinks)
      .where(eq(schema.playgroundToolboxLinks.nodeId, id));

    const links = emptyLinks();
    for (const row of rows) {
      if (PLAYGROUND_TOOLBOX_TYPES.includes(row.toolboxType as (typeof PLAYGROUND_TOOLBOX_TYPES)[number])) {
        links[row.toolboxType as (typeof PLAYGROUND_TOOLBOX_TYPES)[number]].push(row.toolboxId);
      }
    }

    return NextResponse.json({ ok: true, links });
  } catch (err) {
    console.error("Get playground toolbox links error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// PUT /api/worldbuilder/playground/node/[id]/toolbox-links
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
    const node = await getAccessibleSettingNode(id, user.id, user.role);

    if (!node) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    if (node === "NOT_SETTING") {
      return NextResponse.json({ ok: false, error: "NOT_A_SETTING_NODE" }, { status: 400 });
    }

    const body = (await req.json().catch(() => null)) as { links?: unknown } | null;
    if (!body || body.links === undefined) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    const normalizedLinks = normalizeToolboxLinks(body.links);
    const inserts: Array<typeof schema.playgroundToolboxLinks.$inferInsert> = [];

    for (const toolboxType of PLAYGROUND_TOOLBOX_TYPES) {
      for (const toolboxId of normalizedLinks[toolboxType]) {
        inserts.push({
          nodeId: id,
          toolboxType,
          toolboxId,
          createdBy: user.id,
          createdAt: new Date(),
        });
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(schema.playgroundToolboxLinks)
        .where(eq(schema.playgroundToolboxLinks.nodeId, id));

      if (inserts.length > 0) {
        await tx.insert(schema.playgroundToolboxLinks).values(inserts);
      }
    });

    return NextResponse.json({ ok: true, links: normalizedLinks });
  } catch (err) {
    console.error("Update playground toolbox links error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
