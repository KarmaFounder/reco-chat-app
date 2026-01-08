/**
 * Questions - Track and query user questions from the widget
 */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Log a question asked by a user in the widget
 */
export const logQuestion = mutation({
    args: {
        shopify_domain: v.string(),
        question: v.string(),
        answer: v.optional(v.string()),
        product: v.optional(v.string()),
        threadId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("questions", {
            shopify_domain: args.shopify_domain,
            question: args.question,
            answer: args.answer,
            product: args.product,
            threadId: args.threadId,
            createdAt: Date.now(),
        });
    },
});

/**
 * List questions for a store
 */
export const listQuestions = query({
    args: {
        shopify_domain: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;

        const questions = await ctx.db
            .query("questions")
            .withIndex("by_shop", (q) => q.eq("shopify_domain", args.shopify_domain))
            .order("desc")
            .take(limit);

        return questions;
    },
});
