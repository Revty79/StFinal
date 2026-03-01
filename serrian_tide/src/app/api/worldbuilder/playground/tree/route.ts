import { NextResponse } from "next/server";
import { asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSessionUser } from "@/server/session";
import { canUsePlayground, PLAYGROUND_TOOLBOX_TYPES } from "@/lib/playground";

type NodeRow = typeof schema.playgroundNodes.$inferSelect;
type LinkRow = typeof schema.playgroundToolboxLinks.$inferSelect;

type TreeNode = NodeRow & {
  children: TreeNode[];
};

function buildTree(nodes: NodeRow[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const node of nodes) {
    byId.set(node.id, { ...node, children: [] });
  }

  for (const node of byId.values()) {
    if (!node.parentId) {
      roots.push(node);
      continue;
    }

    const parent = byId.get(node.parentId);
    if (!parent) {
      roots.push(node);
      continue;
    }

    parent.children.push(node);
  }

  const sortNodes = (items: TreeNode[]) => {
    items.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
    for (const item of items) {
      sortNodes(item.children);
    }
  };

  sortNodes(roots);
  return roots;
}

function buildLinksByNode(
  links: LinkRow[]
): Record<string, Record<(typeof PLAYGROUND_TOOLBOX_TYPES)[number], string[]>> {
  const result: Record<string, Record<(typeof PLAYGROUND_TOOLBOX_TYPES)[number], string[]>> = {};

  for (const link of links) {
    if (!result[link.nodeId]) {
      result[link.nodeId] = {
        race: [],
        creature: [],
        npc: [],
        calendar: [],
      };
    }

    if (PLAYGROUND_TOOLBOX_TYPES.includes(link.toolboxType as (typeof PLAYGROUND_TOOLBOX_TYPES)[number])) {
      const nodeLinks = result[link.nodeId];
      if (!nodeLinks) continue;
      nodeLinks[link.toolboxType as (typeof PLAYGROUND_TOOLBOX_TYPES)[number]].push(link.toolboxId);
    }
  }

  return result;
}

// GET /api/worldbuilder/playground/tree
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (!canUsePlayground(user.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const nodes =
      user.role === "admin"
        ? await db
            .select()
            .from(schema.playgroundNodes)
            .orderBy(asc(schema.playgroundNodes.sortOrder), asc(schema.playgroundNodes.name))
        : await db
            .select()
            .from(schema.playgroundNodes)
            .where(eq(schema.playgroundNodes.createdBy, user.id))
            .orderBy(asc(schema.playgroundNodes.sortOrder), asc(schema.playgroundNodes.name));

    const nodeIds = nodes.map((n) => n.id);

    const links =
      nodeIds.length === 0
        ? []
        : user.role === "admin"
          ? await db
              .select()
              .from(schema.playgroundToolboxLinks)
              .where(inArray(schema.playgroundToolboxLinks.nodeId, nodeIds))
          : await db
              .select()
              .from(schema.playgroundToolboxLinks)
              .where(inArray(schema.playgroundToolboxLinks.nodeId, nodeIds));

    return NextResponse.json({
      ok: true,
      nodes,
      tree: buildTree(nodes),
      linksByNode: buildLinksByNode(links),
    });
  } catch (err) {
    console.error("Get playground tree error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
