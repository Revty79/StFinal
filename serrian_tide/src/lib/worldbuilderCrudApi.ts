import crypto from "crypto";
import { NextResponse } from "next/server";
import { and, asc, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import { getSessionUser } from "@/server/session";

type BaseToolConfig = {
  table: any;
  itemKey: string;
};

type CollectionToolConfig = BaseToolConfig & {
  listKey: string;
};

function isAdminRole(role: string | undefined | null) {
  return String(role ?? "").toLowerCase() === "admin";
}

function withCanEdit(row: any, userId: string, role: string) {
  return {
    ...row,
    canEdit: isAdminRole(role) || row.createdBy === userId,
  };
}

async function checkExistsById(table: any, id: string) {
  const rows = await db
    .select({ id: table.id })
    .from(table)
    .where(eq(table.id, id))
    .limit(1);

  return rows.length > 0;
}

export function makeToolCollectionHandlers({ table, listKey, itemKey }: CollectionToolConfig) {
  async function GET() {
    try {
      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
      }

      const rows =
        isAdminRole(user.role)
          ? await db.select().from(table).orderBy(asc(table.name))
          : await db
              .select()
              .from(table)
              .where(or(eq(table.createdBy, user.id), eq(table.isFree, true)))
              .orderBy(asc(table.name));

      const transformed = rows.map((row: any) => withCanEdit(row, user.id, user.role));
      const payload: Record<string, unknown> = { ok: true };
      payload[listKey] = transformed;

      return NextResponse.json(payload);
    } catch (err) {
      console.error(`Get ${listKey} error:`, err);
      return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
    }
  }

  async function POST(req: Request) {
    try {
      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
      }

      const body = (await req.json().catch(() => null)) as any;
      if (!body || !body.name || !String(body.name).trim()) {
        return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
      }

      const id = crypto.randomUUID();
      const created = {
        id,
        createdBy: user.id,
        name: String(body.name).trim(),
        tagline: body.tagline ?? null,
        data: body.data ?? null,
        isFree: body.isFree !== undefined ? Boolean(body.isFree) : true,
        isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : false,
      };

      await db.insert(table).values(created);

      const row = withCanEdit(created, user.id, user.role);
      const payload: Record<string, unknown> = { ok: true, id };
      payload[itemKey] = row;

      return NextResponse.json(payload);
    } catch (err) {
      console.error(`Create ${itemKey} error:`, err);
      return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
    }
  }

  return { GET, POST };
}

export function makeToolItemHandlers({ table, itemKey }: BaseToolConfig) {
  async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
      }

      const { id } = await params;

      const whereClause =
        isAdminRole(user.role)
          ? eq(table.id, id)
          : and(eq(table.id, id), or(eq(table.createdBy, user.id), eq(table.isFree, true)));

      const rows = await db.select().from(table).where(whereClause).limit(1);
      if (rows.length === 0) {
        return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      }

      const row = withCanEdit(rows[0], user.id, user.role);
      const payload: Record<string, unknown> = { ok: true, canEdit: row.canEdit };
      payload[itemKey] = row;

      return NextResponse.json(payload);
    } catch (err) {
      console.error(`Get ${itemKey} error:`, err);
      return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
    }
  }

  async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
      }

      const { id } = await params;
      const body = (await req.json().catch(() => null)) as any;
      if (!body) {
        return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
      }

      if (body.name !== undefined && !String(body.name).trim()) {
        return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
      }

      const updates: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (body.name !== undefined) {
        updates.name = String(body.name).trim();
      }
      if (body.tagline !== undefined) {
        updates.tagline = body.tagline ?? null;
      }
      if (body.data !== undefined) {
        updates.data = body.data ?? null;
      }
      if (body.isFree !== undefined) {
        updates.isFree = Boolean(body.isFree);
      }
      if (body.isPublished !== undefined) {
        updates.isPublished = Boolean(body.isPublished);
      }

      const whereClause =
        isAdminRole(user.role)
          ? eq(table.id, id)
          : and(eq(table.id, id), eq(table.createdBy, user.id));

      const updated = await db.update(table).set(updates).where(whereClause).returning();

      if (updated.length === 0) {
        const exists = await checkExistsById(table, id);
        if (!exists) {
          return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
        }
        return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
      }

      const row = withCanEdit(updated[0], user.id, user.role);
      const payload: Record<string, unknown> = { ok: true, canEdit: row.canEdit };
      payload[itemKey] = row;

      return NextResponse.json(payload);
    } catch (err) {
      console.error(`Update ${itemKey} error:`, err);
      return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
    }
  }

  async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
      }

      const { id } = await params;
      const whereClause =
        isAdminRole(user.role)
          ? eq(table.id, id)
          : and(eq(table.id, id), eq(table.createdBy, user.id));

      const deleted = await db
        .delete(table)
        .where(whereClause)
        .returning({ id: table.id });

      if (deleted.length === 0) {
        const exists = await checkExistsById(table, id);
        if (!exists) {
          return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
        }
        return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
      }

      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error(`Delete ${itemKey} error:`, err);
      return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
    }
  }

  return { GET, PUT, DELETE };
}
