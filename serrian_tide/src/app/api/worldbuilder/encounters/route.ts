import { schema } from "@/db/client";
import { makeToolCollectionHandlers } from "@/lib/worldbuilderCrudApi";

const handlers = makeToolCollectionHandlers({
  table: schema.encounters,
  listKey: "encounters",
  itemKey: "encounter",
});

export const GET = handlers.GET;
export const POST = handlers.POST;

