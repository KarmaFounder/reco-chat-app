/**
 * Convex Client for Server-Side Operations
 * 
 * This module provides a configured Convex client for use in Shopify app routes
 * to interact with the Convex backend for store management, analytics, etc.
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Initialize the Convex client with the deployment URL
const getConvexClient = () => {
    const convexUrl = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;

    if (!convexUrl) {
        console.warn("CONVEX_URL not configured - Convex functions will not work");
        return null;
    }

    return new ConvexHttpClient(convexUrl);
};

// Singleton client instance
let convexClient: ConvexHttpClient | null = null;

export const getClient = () => {
    if (!convexClient) {
        convexClient = getConvexClient();
    }
    return convexClient;
};

/**
 * Register a store in Convex when they install/auth the app
 */
export async function registerStoreInConvex(storeData: {
    shopify_domain: string;
    shopify_store_id?: string;
    name?: string;
    email?: string;
}) {
    const client = getClient();
    if (!client) {
        console.warn("Convex client not available - skipping store registration");
        return null;
    }

    try {
        const storeId = await client.mutation(api.stores.registerStore, storeData);
        console.log(`[Convex] Registered store: ${storeData.shopify_domain} -> ${storeId}`);
        return storeId;
    } catch (error) {
        console.error("[Convex] Failed to register store:", error);
        return null;
    }
}

/**
 * Get store settings from Convex
 */
export async function getStoreSettingsFromConvex(shopify_domain: string) {
    const client = getClient();
    if (!client) return null;

    try {
        return await client.query(api.stores.getStoreSettings, { shopify_domain });
    } catch (error) {
        console.error("[Convex] Failed to get store settings:", error);
        return null;
    }
}

/**
 * Handle store uninstall in Convex
 */
export async function uninstallStoreFromConvex(shopify_domain: string) {
    const client = getClient();
    if (!client) return null;

    try {
        return await client.mutation(api.stores.uninstallStore, { shopify_domain });
    } catch (error) {
        console.error("[Convex] Failed to uninstall store:", error);
        return null;
    }
}

/**
 * Update store plan in Convex (when subscription changes)
 */
export async function updateStorePlanInConvex(
    shopify_domain: string,
    plan: "free" | "pro" | "enterprise"
) {
    const client = getClient();
    if (!client) return null;

    try {
        return await client.mutation(api.stores.updateStorePlan, {
            shopify_domain,
            plan,
        });
    } catch (error) {
        console.error("[Convex] Failed to update store plan:", error);
        return null;
    }
}

export { api };
