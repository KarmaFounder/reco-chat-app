import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Onboarding Functions
 * 
 * Handle the store onboarding flow:
 * - Check if onboarding is complete
 * - Save onboarding data
 * - Get onboarding status
 */

// Check if a store has completed onboarding
export const checkOnboardingStatus = query({
    args: { shopify_domain: v.string() },
    handler: async (ctx, args) => {
        const store = await ctx.db
            .query("stores")
            .withIndex("byShopifyDomain", (q) => q.eq("shopify_domain", args.shopify_domain))
            .first();

        if (!store) {
            return { exists: false, completed: false };
        }

        return {
            exists: true,
            completed: store.onboarding_completed === true,
            data: store.onboarding_completed ? {
                contact_name: store.contact_name,
                contact_email: store.contact_email,
                brand_name: store.brand_name,
                review_provider: store.review_provider,
            } : null,
        };
    },
});

// Complete onboarding - save all data
export const completeOnboarding = mutation({
    args: {
        shopify_domain: v.string(),
        contact_name: v.string(),
        contact_email: v.string(),
        brand_name: v.string(),
        review_provider: v.string(),
        review_api_key: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const store = await ctx.db
            .query("stores")
            .withIndex("byShopifyDomain", (q) => q.eq("shopify_domain", args.shopify_domain))
            .first();

        if (!store) {
            throw new Error("Store not found. Please install the app first.");
        }

        await ctx.db.patch(store._id, {
            onboarding_completed: true,
            contact_name: args.contact_name,
            contact_email: args.contact_email,
            brand_name: args.brand_name,
            review_provider: args.review_provider,
            review_api_key: args.review_api_key,
        });

        return { success: true, storeId: store._id };
    },
});

// Get store onboarding data (for display in admin)
export const getOnboardingData = query({
    args: { shopify_domain: v.string() },
    handler: async (ctx, args) => {
        const store = await ctx.db
            .query("stores")
            .withIndex("byShopifyDomain", (q) => q.eq("shopify_domain", args.shopify_domain))
            .first();

        if (!store) {
            return null;
        }

        return {
            onboarding_completed: store.onboarding_completed,
            contact_name: store.contact_name,
            contact_email: store.contact_email,
            brand_name: store.brand_name,
            review_provider: store.review_provider,
            has_api_key: !!store.review_api_key,
        };
    },
});

// Update review provider (for changing later)
export const updateReviewProvider = mutation({
    args: {
        shopify_domain: v.string(),
        review_provider: v.string(),
        review_api_key: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const store = await ctx.db
            .query("stores")
            .withIndex("byShopifyDomain", (q) => q.eq("shopify_domain", args.shopify_domain))
            .first();

        if (!store) {
            throw new Error("Store not found");
        }

        await ctx.db.patch(store._id, {
            review_provider: args.review_provider,
            review_api_key: args.review_api_key,
        });

        return { success: true };
    },
});

// Reset onboarding (for demo/testing purposes)
export const resetOnboarding = mutation({
    args: { shopify_domain: v.string() },
    handler: async (ctx, args) => {
        const store = await ctx.db
            .query("stores")
            .withIndex("byShopifyDomain", (q) => q.eq("shopify_domain", args.shopify_domain))
            .first();

        if (!store) {
            throw new Error("Store not found");
        }

        await ctx.db.patch(store._id, {
            onboarding_completed: false,
            contact_name: undefined,
            contact_email: undefined,
            brand_name: undefined,
            review_provider: undefined,
            review_api_key: undefined,
        });

        return { success: true, message: "Onboarding reset. Refresh to start onboarding again." };
    },
});
