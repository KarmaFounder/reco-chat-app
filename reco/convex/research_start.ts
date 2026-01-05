import { action } from "./_generated/server";
import { v } from "convex/values";

export const start = action({
  args: { query: v.string(), product: v.optional(v.string()), history: v.optional(v.array(v.object({ role: v.string(), text: v.string() }))) },
  handler: async (ctx, { query, product, history }) => {
    const id = await (ctx.runMutation as any)("research:create", {});
    console.log("[research.start] queued", { id, product, qLen: query.length, historyLen: history?.length || 0 });
    await (ctx.scheduler.runAfter as any)(0, "research:run", { id, query, product, history: history || [] });
    return { id };
  },
});
