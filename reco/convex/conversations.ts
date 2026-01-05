import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Conversation and Message Management
 * 
 * These functions handle the lifecycle of chat conversations:
 * - Creating new conversations when widget opens
 * - Saving user and assistant messages
 * - Updating conversation status
 * - Querying conversation history
 */

// Create a new conversation when widget is opened
export const createConversation = mutation({
    args: {
        shopify_domain: v.string(),
        session_id: v.string(),
        product_id: v.optional(v.string()),
        product_title: v.optional(v.string()),
        customer_metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        // Check if conversation already exists for this session
        const existing = await ctx.db
            .query("conversations")
            .withIndex("bySession", (q) => q.eq("session_id", args.session_id))
            .first();

        if (existing) {
            return existing._id;
        }

        // Find the store ID if it exists
        const store = await ctx.db
            .query("stores")
            .withIndex("byShopifyDomain", (q) => q.eq("shopify_domain", args.shopify_domain))
            .first();

        const conversationId = await ctx.db.insert("conversations", {
            store_id: store?._id,
            shopify_domain: args.shopify_domain,
            session_id: args.session_id,
            product_id: args.product_id,
            product_title: args.product_title,
            status: "active",
            messages_count: 0,
            started_at: new Date().toISOString(),
            customer_metadata: args.customer_metadata,
        });

        return conversationId;
    },
});

// Save a message (user or assistant)
export const saveMessage = mutation({
    args: {
        conversation_id: v.id("conversations"),
        role: v.string(), // "user" | "assistant"
        content: v.string(),
        sources_count: v.optional(v.number()),
        suggestions: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        // Insert the message
        const messageId = await ctx.db.insert("messages", {
            conversation_id: args.conversation_id,
            role: args.role,
            content: args.content,
            created_at: new Date().toISOString(),
            sources_count: args.sources_count,
            suggestions: args.suggestions,
        });

        // Update conversation message count
        const conversation = await ctx.db.get(args.conversation_id);
        if (conversation) {
            await ctx.db.patch(args.conversation_id, {
                messages_count: conversation.messages_count + 1,
            });
        }

        return messageId;
    },
});

// Get or create a conversation for a session
export const getOrCreateConversation = mutation({
    args: {
        shopify_domain: v.string(),
        session_id: v.string(),
        product_id: v.optional(v.string()),
        product_title: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if conversation already exists
        const existing = await ctx.db
            .query("conversations")
            .withIndex("bySession", (q) => q.eq("session_id", args.session_id))
            .first();

        if (existing) {
            return { conversation_id: existing._id, isNew: false };
        }

        // Find the store
        const store = await ctx.db
            .query("stores")
            .withIndex("byShopifyDomain", (q) => q.eq("shopify_domain", args.shopify_domain))
            .first();

        // Create new conversation
        const conversationId = await ctx.db.insert("conversations", {
            store_id: store?._id,
            shopify_domain: args.shopify_domain,
            session_id: args.session_id,
            product_id: args.product_id,
            product_title: args.product_title,
            status: "active",
            messages_count: 0,
            started_at: new Date().toISOString(),
        });

        return { conversation_id: conversationId, isNew: true };
    },
});

// Get messages for a conversation
export const getMessages = query({
    args: { conversation_id: v.id("conversations") },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("byConversation", (q) => q.eq("conversation_id", args.conversation_id))
            .order("asc")
            .collect();

        return messages;
    },
});

// Get conversation by session ID
export const getConversationBySession = query({
    args: { session_id: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("conversations")
            .withIndex("bySession", (q) => q.eq("session_id", args.session_id))
            .first();
    },
});

// End a conversation (mark as completed)
export const endConversation = mutation({
    args: { conversation_id: v.id("conversations") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.conversation_id, {
            status: "completed",
            ended_at: new Date().toISOString(),
        });
    },
});

// Get recent conversations for a store
export const getStoreConversations = query({
    args: {
        shopify_domain: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;

        const conversations = await ctx.db
            .query("conversations")
            .withIndex("byShopifyDomain", (q) => q.eq("shopify_domain", args.shopify_domain))
            .order("desc")
            .take(limit);

        return conversations;
    },
});

// Get conversation stats for a store (for analytics)
export const getConversationStats = query({
    args: { shopify_domain: v.string() },
    handler: async (ctx, args) => {
        const conversations = await ctx.db
            .query("conversations")
            .withIndex("byShopifyDomain", (q) => q.eq("shopify_domain", args.shopify_domain))
            .collect();

        const today = new Date().toISOString().split("T")[0];
        const todayConversations = conversations.filter(
            (c) => c.started_at.startsWith(today)
        );

        const totalMessages = conversations.reduce(
            (sum, c) => sum + c.messages_count,
            0
        );
        const todayMessages = todayConversations.reduce(
            (sum, c) => sum + c.messages_count,
            0
        );

        return {
            totalConversations: conversations.length,
            conversationsToday: todayConversations.length,
            totalMessages,
            messagesToday: todayMessages,
            avgMessagesPerConversation:
                conversations.length > 0
                    ? Math.round((totalMessages / conversations.length) * 10) / 10
                    : 0,
        };
    },
});
