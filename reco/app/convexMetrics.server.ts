type ConvexOverview = {
  totalConversations: number;
  conversationsToday: number;
  avgMessagesPerConversation: number;
  messagesToday: number;
  last7Days: { label: string; conversations: number; messages: number }[];
};

/**
 * Fetch live metrics from Convex, if configured.
 *
 * This expects a Convex HTTP function like `analytics:getOverview` to exist.
 * If CONVEX_URL or the function is missing, it safely returns null so the UI
 * can fall back to placeholder metrics.
 */
export async function fetchConvexMetrics(): Promise<ConvexOverview | null> {
  const baseUrl = process.env.CONVEX_URL;

  if (!baseUrl) {
    return null;
  }

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/analytics:getOverview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      console.warn("Convex metrics request failed", res.status);
      return null;
    }

    const data = (await res.json()) as Partial<ConvexOverview>;

    return {
      totalConversations: Number(data.totalConversations ?? 0),
      conversationsToday: Number(data.conversationsToday ?? 0),
      avgMessagesPerConversation: Number(data.avgMessagesPerConversation ?? 0),
      messagesToday: Number(data.messagesToday ?? 0),
      last7Days: Array.isArray(data.last7Days)
        ? data.last7Days.map((d: any) => ({
            label: String(d.label ?? ""),
            conversations: Number(d.conversations ?? 0),
            messages: Number(d.messages ?? 0),
          }))
        : [],
    };
  } catch (err) {
    console.warn("Convex metrics fetch error", err);
    return null;
  }
}
