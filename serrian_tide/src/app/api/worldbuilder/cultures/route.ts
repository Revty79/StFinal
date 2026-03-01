import { schema } from "@/db/client";
import { makeToolCollectionHandlers } from "@/lib/worldbuilderCrudApi";

const handlers = makeToolCollectionHandlers({
  table: schema.cultures,
  listKey: "cultures",
  itemKey: "culture",
});

export const GET = handlers.GET;
export const POST = handlers.POST;

