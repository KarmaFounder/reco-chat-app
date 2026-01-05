import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const m = await ctx.db.query("metadata").first();
    return m ?? null;
  },
});

export const setSeeded = mutation({
  args: { isSeeded: v.boolean() },
  handler: async (ctx, { isSeeded }) => {
    const now = new Date().toISOString();
    const m = await ctx.db.query("metadata").first();
    if (m) {
      await ctx.db.patch(m._id, { isSeeded, lastUploadAt: now });
      return m._id;
    }
    return await ctx.db.insert("metadata", { isSeeded, lastUploadAt: now });
  },
});

export const setDemoThreadId = mutation({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const m = await ctx.db.query("metadata").first();
    if (m) {
      await ctx.db.patch(m._id, { demoThreadId: threadId });
      return m._id;
    }
    return await ctx.db.insert("metadata", { demoThreadId: threadId });
  },
});
