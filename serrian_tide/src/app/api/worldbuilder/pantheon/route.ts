import { schema } from "@/db/client";
import { makeToolCollectionHandlers } from "@/lib/worldbuilderCrudApi";

const handlers = makeToolCollectionHandlers({
  table: schema.pantheon,
  listKey: "pantheon",
  itemKey: "deity",
});

export const GET = handlers.GET;
export const POST = handlers.POST;

