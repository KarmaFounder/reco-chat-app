import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // =========== STORE MANAGEMENT ===========
  // Stores that have installed the Reco extension (each store = a user)
  stores: defineTable({
    shopify_domain: v.string(), // e.g., "my-store.myshopify.com"
    shopify_store_id: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    plan: v.string(), // "free" | "pro" | "enterprise"
    status: v.string(), // "active" | "paused" | "uninstalled"
    installed_at: v.string(),
    uninstalled_at: v.optional(v.string()),
    // Onboarding data
    onboarding_completed: v.optional(v.boolean()),
    contact_name: v.optional(v.string()),
    contact_email: v.optional(v.string()),
    brand_name: v.optional(v.string()),
    review_provider: v.optional(v.string()), // "okendo" | "judge_me" | "stamped" | "yotpo" | "reviews_io" | "demo"
    review_api_key: v.optional(v.string()),
    // Widget settings
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

  // User questions from the widget
  questions: defineTable({
    shopify_domain: v.string(),
    question: v.string(),
    answer: v.optional(v.string()),
    product: v.optional(v.string()),
    threadId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_shop", ["shopify_domain"])
    .index("by_created", ["createdAt"]),

  // Store analytics and usage tracking
  store_analytics: defineTable({
    store_id: v.id("stores"),
    date: v.string(), // ISO date string (YYYY-MM-DD)
    conversations: v.number(),
    messages: v.number(),
    recommendations_shown: v.number(),
    clicks: v.number(),
    conversions: v.number(),
    revenue_attributed: v.optional(v.number()),
  })
    .index("byStoreAndDate", ["store_id", "date"]),

  // =========== CONVERSATIONS ===========
  // Each chat session with a customer
  conversations: defineTable({
    store_id: v.optional(v.id("stores")), // Optional for demo/legacy
    shopify_domain: v.string(), // Store domain for easy lookup
    session_id: v.string(), // Unique session identifier from widget
    product_id: v.optional(v.string()),
    product_title: v.optional(v.string()),
    status: v.string(), // "active" | "completed" | "abandoned"
    messages_count: v.number(),
    started_at: v.string(),
    ended_at: v.optional(v.string()),
    customer_metadata: v.optional(v.any()), // Browser, device, UTM params, etc.
  })
    .index("byShopifyDomain", ["shopify_domain"])
    .index("bySession", ["session_id"])
    .index("byStoreAndStatus", ["shopify_domain", "status"])
    .index("byStartedAt", ["started_at"]),

  // =========== MESSAGES ===========
  // Individual messages within a conversation
  messages: defineTable({
    conversation_id: v.id("conversations"),
    role: v.string(), // "user" | "assistant"
    content: v.string(),
    created_at: v.string(),
    // For assistant messages:
    sources_count: v.optional(v.number()), // How many review sources were used
    suggestions: v.optional(v.array(v.string())), // Follow-up suggestions
  })
    .index("byConversation", ["conversation_id"])
    .index("byCreatedAt", ["created_at"]),

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

  // =========== LEGACY TABLES (kept for demo/migration) ===========
  metadata: defineTable({
    isSeeded: v.optional(v.boolean()),
    lastUploadAt: v.optional(v.string()),
    demoThreadId: v.optional(v.string()),
  }),

  // Legacy skims_reviews table (used by demo, will migrate to 'reviews')
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
});
