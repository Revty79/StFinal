import { schema } from "@/db/client";
import { makeToolCollectionHandlers } from "@/lib/worldbuilderCrudApi";

const handlers = makeToolCollectionHandlers({
  table: schema.timeline,
  listKey: "timeline",
  itemKey: "timelineEntry",
});

export const GET = handlers.GET;
export const POST = handlers.POST;

