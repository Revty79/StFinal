import { schema } from "@/db/client";
import { makeToolItemHandlers } from "@/lib/worldbuilderCrudApi";

const handlers = makeToolItemHandlers({
  table: schema.pantheon,
  itemKey: "deity",
});

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;

