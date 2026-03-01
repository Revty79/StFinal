import { schema } from "@/db/client";
import { makeToolCollectionHandlers } from "@/lib/worldbuilderCrudApi";

const handlers = makeToolCollectionHandlers({
  table: schema.settlements,
  listKey: "settlements",
  itemKey: "settlement",
});

export const GET = handlers.GET;
export const POST = handlers.POST;

