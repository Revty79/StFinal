import { schema } from "@/db/client";
import { makeToolCollectionHandlers } from "@/lib/worldbuilderCrudApi";

const handlers = makeToolCollectionHandlers({
  table: schema.factions,
  listKey: "factions",
  itemKey: "faction",
});

export const GET = handlers.GET;
export const POST = handlers.POST;

