import { schema } from "@/db/client";
import { makeToolCollectionHandlers } from "@/lib/worldbuilderCrudApi";

const handlers = makeToolCollectionHandlers({
  table: schema.dungeons,
  listKey: "dungeons",
  itemKey: "dungeon",
});

export const GET = handlers.GET;
export const POST = handlers.POST;

