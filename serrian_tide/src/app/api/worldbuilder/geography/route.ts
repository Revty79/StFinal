import { schema } from "@/db/client";
import { makeToolCollectionHandlers } from "@/lib/worldbuilderCrudApi";

const handlers = makeToolCollectionHandlers({
  table: schema.geography,
  listKey: "geography",
  itemKey: "geography",
});

export const GET = handlers.GET;
export const POST = handlers.POST;

