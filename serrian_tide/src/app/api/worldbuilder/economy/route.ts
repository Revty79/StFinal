import { schema } from "@/db/client";
import { makeToolCollectionHandlers } from "@/lib/worldbuilderCrudApi";

const handlers = makeToolCollectionHandlers({
  table: schema.economy,
  listKey: "economy",
  itemKey: "economyEntry",
});

export const GET = handlers.GET;
export const POST = handlers.POST;

