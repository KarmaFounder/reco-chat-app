import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // =========== STORE MANAGEMENT ===========
  // Stores that have installed the Reco extension
  stores: defineTable({
    shopify_domain: v.string(), // e.g., "my-store.myshopify.com"
    shopify_store_id: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    plan: v.string(), // "free" | "pro" | "enterprise"
    status: v.string(), // "active" | "paused" | "uninstalled"
    installed_at: v.string(),
    uninstalled_at: v.optional(v.string()),
    settings: v.optional(v.object({
      widget_enabled: v.boolean(),
      widget_position: v.optional(v.string()), // "bottom-right" | "bottom-left"
      primary_color: v.optional(v.string()),
      welcome_message: v.optional(v.string()),
      data_sources: v.optional(v.array(v.string())), // ["okendo", "judge.me", ...]
    })),
    metadata: v.optional(v.any()),
  })
    .index("byShopifyDomain", ["shopify_domain"])
    .index("byStatus", ["status"])
    .index("byPlan", ["plan"]),

  // Store analytics and usage tracking
  store_analytics: defineTable({
    store_id: v.id("stores"),
    date: v.string(), // ISO date string
    conversations: v.number(),
    messages: v.number(),
    recommendations_shown: v.number(),
    clicks: v.number(),
    conversions: v.number(),
    revenue_attributed: v.optional(v.number()),
  })
    .index("byStoreAndDate", ["store_id", "date"]),

  // =========== REVIEWS (multi-tenant) ===========
  reviews: defineTable({
    store_id: v.id("stores"),
    external_id: v.optional(v.string()),
    product_id: v.optional(v.string()),
    product_title: v.optional(v.string()),
    author_name: v.string(),
    rating: v.number(),
    fit_feedback: v.optional(v.string()),
    review_body: v.string(),
    source: v.string(), // "okendo" | "judge.me" | "stamped" | "yotpo" | "reviews.io"
    created_at: v.string(),
    embedding: v.optional(v.array(v.float64())),
  })
    .index("byStore", ["store_id"])
    .index("byStoreAndProduct", ["store_id", "product_id"])
    .index("bySource", ["source"])
    .vectorIndex("byEmbedding", {
      vectorField: "embedding",
      dimensions: 768,
      filterFields: ["store_id", "product_id"]
    }),

  // =========== CONVERSATIONS ===========
  conversations: defineTable({
    store_id: v.id("stores"),
    session_id: v.string(), // Unique session identifier
    product_id: v.optional(v.string()),
    product_title: v.optional(v.string()),
    status: v.string(), // "active" | "completed" | "abandoned"
    messages_count: v.number(),
    started_at: v.string(),
    ended_at: v.optional(v.string()),
    metadata: v.optional(v.any()), // Customer info, UTM params, etc.
  })
    .index("byStore", ["store_id"])
    .index("bySession", ["session_id"])
    .index("byStoreAndStatus", ["store_id", "status"]),

  // =========== LEGACY TABLES (kept for compatibility) ===========
  metadata: defineTable({
    isSeeded: v.optional(v.boolean()),
    lastUploadAt: v.optional(v.string()),
    demoThreadId: v.optional(v.string()),
  }),

  // Legacy skims_reviews table (will migrate to 'reviews')
  skims_reviews: defineTable({
    external_id: v.optional(v.string()),
    product: v.optional(v.string()),
    author_name: v.string(),
    rating: v.number(),
    fit_feedback: v.string(),
    review_body: v.string(),
    created_at: v.string(),
    embedding: v.array(v.float64()),
  })
    .vectorIndex("byEmbedding", { vectorField: "embedding", dimensions: 768, filterFields: ["product"] })
    .index("byCreatedAt", ["created_at"]),

  research_sessions: defineTable({
    status: v.string(), // running|done|error
    steps: v.array(v.string()),
    answer: v.optional(v.string()),
    sources: v.optional(v.any()),
    suggestions: v.optional(v.array(v.string())),
    created_at: v.string(),
  }),
});
