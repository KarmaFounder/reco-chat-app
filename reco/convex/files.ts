import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUrl = query({
  args: { id: v.id("_storage") },
  handler: async (ctx, { id }) => {
    try {
      const url = await ctx.storage.getUrl(id);
      return { url: url || null };
    } catch (e) {
      return { url: null };
    }
  },
});
