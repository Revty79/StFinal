import { schema } from "@/db/client";
import { makeToolCollectionHandlers } from "@/lib/worldbuilderCrudApi";

const handlers = makeToolCollectionHandlers({
  table: schema.plotHooks,
  listKey: "plotHooks",
  itemKey: "plotHook",
});

export const GET = handlers.GET;
export const POST = handlers.POST;

