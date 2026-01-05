import { getClient, api } from "./convex.server";

type ConvexOverview = {
  totalConversations: number;
  conversationsToday: number;
  avgMessagesPerConversation: number;
  messagesToday: number;
  last7Days: { label: string; conversations: number; messages: number }[];
};

/**
 * Fetch live metrics from Convex for the Shopify admin dashboard.
 * 
 * Uses the conversations.getConversationStats query to get real-time
 * data for the store.
 * 
 * @param shopify_domain - The store's Shopify domain (e.g., "my-store.myshopify.com")
 */
export async function fetchConvexMetrics(shopify_domain?: string): Promise<ConvexOverview | null> {
  const client = getClient();

  if (!client) {
    console.warn("Convex client not available - returning null metrics");
    return null;
  }

  if (!shopify_domain) {
    // Return empty metrics if no domain provided
    return {
      totalConversations: 0,
      conversationsToday: 0,
      avgMessagesPerConversation: 0,
      messagesToday: 0,
      last7Days: generateLast7DaysPlaceholder(),
    };
  }

  try {
    // Get conversation stats from Convex
    const stats = await client.query(api.conversations.getConversationStats, {
      shopify_domain,
    });

    if (!stats) {
      return {
        totalConversations: 0,
        conversationsToday: 0,
        avgMessagesPerConversation: 0,
        messagesToday: 0,
        last7Days: generateLast7DaysPlaceholder(),
      };
    }

    return {
      totalConversations: stats.totalConversations,
      conversationsToday: stats.conversationsToday,
      avgMessagesPerConversation: stats.avgMessagesPerConversation,
      messagesToday: stats.messagesToday,
      last7Days: generateLast7DaysPlaceholder(), // TODO: Implement daily breakdown in Convex
    };
  } catch (err) {
    console.error("Convex metrics fetch error:", err);
    return null;
  }
}

/**
 * Generate placeholder data for last 7 days chart
 * TODO: Implement proper daily aggregation in Convex
 */
function generateLast7DaysPlaceholder(): { label: string; conversations: number; messages: number }[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date().getDay();

  return Array.from({ length: 7 }, (_, i) => {
    const dayIndex = (today - 6 + i + 7) % 7;
    return {
      label: days[dayIndex],
      conversations: 0,
      messages: 0,
    };
  });
}
