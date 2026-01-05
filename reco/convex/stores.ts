import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Store Management Functions
 * 
 * These functions handle store (user) lifecycle:
 * - Registration when a store installs the app
 * - Retrieving store configuration
 * - Updating store settings
 * - Handling uninstalls
 */

// Register a new store when they install the Reco app
export const registerStore = mutation({
    args: {
        shopify_domain: v.string(),
        shopify_store_id: v.optional(v.string()),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if store already exists
        const existingStore = await ctx.db
            .query("stores")
            .withIndex("byShopifyDomain", (q) => q.eq("shopify_domain", args.shopify_domain))
            .first();

        if (existingStore) {
            // Store exists - reactivate if previously uninstalled
            if (existingStore.status === "uninstalled") {
                await ctx.db.patch(existingStore._id, {
                    status: "active",
                    installed_at: new Date().toISOString(),
                    uninstalled_at: undefined,
                    name: args.name || existingStore.name,
                    email: args.email || existingStore.email,
                });
            }
            return existingStore._id;
        }

        // Create new store record
        const storeId = await ctx.db.insert("stores", {
            shopify_domain: args.shopify_domain,
            shopify_store_id: args.shopify_store_id,
            name: args.name,
            email: args.email,
            plan: "free",
            status: "active",
            installed_at: new Date().toISOString(),
            settings: {
                widget_enabled: true,
                widget_position: "bottom-right",
                primary_color: "#6366f1",
                welcome_message: "Hi! I'm here to help you find the perfect product.",
                data_sources: [],
            },
        });

        return storeId;
    },
});

// Get store by domain (for widget/API authentication)
export const getStoreByDomain = query({
    args: { shopify_domain: v.string() },
    handler: async (ctx, args) => {
        const store = await ctx.db
            .query("stores")
            .withIndex("byShopifyDomain", (q) => q.eq("shopify_domain", args.shopify_domain))
            .first();

        if (!store || store.status !== "active") {
            return null;
        }

        return store;
    },
});

// Get store settings (for widget configuration)
export const getStoreSettings = query({
    args: { shopify_domain: v.string() },
    handler: async (ctx, args) => {
        const store = await ctx.db
            .query("stores")
            .withIndex("byShopifyDomain", (q) => q.eq("shopify_domain", args.shopify_domain))
            .first();

        if (!store || store.status !== "active") {
            return null;
        }

        return {
            storeId: store._id,
            plan: store.plan,
            settings: store.settings,
        };
    },
});

// Update store settings
export const updateStoreSettings = mutation({
    args: {
        shopify_domain: v.string(),
        settings: v.object({
            widget_enabled: v.optional(v.boolean()),
            widget_position: v.optional(v.string()),
            primary_color: v.optional(v.string()),
            welcome_message: v.optional(v.string()),
            data_sources: v.optional(v.array(v.string())),
        }),
    },
    handler: async (ctx, args) => {
        const store = await ctx.db
            .query("stores")
            .withIndex("byShopifyDomain", (q) => q.eq("shopify_domain", args.shopify_domain))
            .first();

        if (!store) {
            throw new Error("Store not found");
        }

        const updatedSettings = {
            widget_enabled: args.settings.widget_enabled ?? store.settings?.widget_enabled ?? true,
            widget_position: args.settings.widget_position ?? store.settings?.widget_position,
            primary_color: args.settings.primary_color ?? store.settings?.primary_color,
            welcome_message: args.settings.welcome_message ?? store.settings?.welcome_message,
            data_sources: args.settings.data_sources ?? store.settings?.data_sources,
        };

        await ctx.db.patch(store._id, { settings: updatedSettings });
        return { success: true };
    },
});

// Update store plan (for subscription changes)
export const updateStorePlan = mutation({
    args: {
        shopify_domain: v.string(),
        plan: v.string(),
    },
    handler: async (ctx, args) => {
        const store = await ctx.db
            .query("stores")
            .withIndex("byShopifyDomain", (q) => q.eq("shopify_domain", args.shopify_domain))
            .first();

        if (!store) {
            throw new Error("Store not found");
        }

        await ctx.db.patch(store._id, { plan: args.plan });
        return { success: true };
    },
});

// Handle app uninstall
export const uninstallStore = mutation({
    args: { shopify_domain: v.string() },
    handler: async (ctx, args) => {
        const store = await ctx.db
            .query("stores")
            .withIndex("byShopifyDomain", (q) => q.eq("shopify_domain", args.shopify_domain))
            .first();

        if (!store) {
            return { success: false, message: "Store not found" };
        }

        await ctx.db.patch(store._id, {
            status: "uninstalled",
            uninstalled_at: new Date().toISOString(),
        });

        return { success: true };
    },
});

// List all active stores (admin function)
export const listActiveStores = query({
    args: {},
    handler: async (ctx) => {
        const stores = await ctx.db
            .query("stores")
            .withIndex("byStatus", (q) => q.eq("status", "active"))
            .collect();

        return stores.map((store) => ({
            id: store._id,
            domain: store.shopify_domain,
            name: store.name,
            plan: store.plan,
            installed_at: store.installed_at,
        }));
    },
});

// Get store count by plan
export const getStoreCounts = query({
    args: {},
    handler: async (ctx) => {
        const stores = await ctx.db.query("stores").collect();

        const counts = {
            total: stores.length,
            active: 0,
            free: 0,
            pro: 0,
            enterprise: 0,
        };

        for (const store of stores) {
            if (store.status === "active") {
                counts.active++;
                if (store.plan === "free") counts.free++;
                if (store.plan === "pro") counts.pro++;
                if (store.plan === "enterprise") counts.enterprise++;
            }
        }

        return counts;
    },
});
