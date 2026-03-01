import { schema } from "@/db/client";
import { makeToolItemHandlers } from "@/lib/worldbuilderCrudApi";

const handlers = makeToolItemHandlers({
  table: schema.encounters,
  itemKey: "encounter",
});

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;

