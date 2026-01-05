import { query } from "./_generated/server";
import { v } from "convex/values";
import { listUIMessages, syncStreams } from "@convex-dev/agent";
import { components as generatedComponents } from "./_generated/api";

export const listUIMessagesForThread = query({
  args: {
    threadId: v.string(),
    paginationOpts: v.object({ cursor: v.optional(v.string()), numItems: v.number() }),
    streamArgs: v.optional(v.object({ startOrder: v.optional(v.number()) })),
  },
  handler: async (ctx, { threadId, paginationOpts, streamArgs }) => {
    const component = (generatedComponents as any).agent;
    const pageOpts = { cursor: paginationOpts?.cursor ?? null, numItems: paginationOpts.numItems } as any;
    const paginated = await listUIMessages(ctx as any, component, { threadId, paginationOpts: pageOpts });
    const streams = await syncStreams(ctx as any, component, { threadId, ...(streamArgs || {}) });
    return { ...paginated, streams };
  },
});
