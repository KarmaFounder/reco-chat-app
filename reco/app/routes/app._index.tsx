import { useEffect } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { fetchConvexMetrics } from "../convexMetrics.server";
import { registerStoreInConvex } from "../convex.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);

  // Register/update the store in Convex on each access
  // This ensures we have the store as a "user" in our database
  try {
    await registerStoreInConvex({
      shopify_domain: session.shop,
      name: session.shop.replace('.myshopify.com', ''),
    });
  } catch (error) {
    console.error("Failed to register store in Convex:", error);
  }

  // Check billing (allow to fail gracefully for dev)
  try {
    await billing.require({
      plans: ["Monthly Subscription"],
      isTest: true,
      onFailure: async () => billing.request({ plan: "Monthly Subscription", isTest: true }),
    });
  } catch (error) {
    console.warn("Billing check failed (likely due to non-public app distribution). Skipping...", error);
  }

  const convex = await fetchConvexMetrics();

  // Shape used by the UI
  const metrics = {
    totalConversations: convex?.totalConversations ?? 0,
    conversationsToday: convex?.conversationsToday ?? 0,
    avgMessagesPerConversation: convex?.avgMessagesPerConversation ?? 0,
    messagesToday: convex?.messagesToday ?? 0,
    last7Days:
      convex?.last7Days ??
      [
        { label: "Mon", conversations: 3, messages: 18 },
        { label: "Tue", conversations: 4, messages: 22 },
        { label: "Wed", conversations: 2, messages: 11 },
        { label: "Thu", conversations: 5, messages: 30 },
        { label: "Fri", conversations: 6, messages: 34 },
        { label: "Sat", conversations: 2, messages: 9 },
        { label: "Sun", conversations: 1, messages: 5 },
      ],
  };

  return {
    metrics,
    shop: session.shop,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === "upload-knowledge") {
    const file = formData.get("knowledgeFile");

    if (!file || typeof file === "string") {
      return { error: "No file uploaded" };
    }

    const typedFile = file as File;

    return {
      uploadResult: {
        name: typedFile.name,
        size: typedFile.size,
      },
    };
  }

  if (intent === "feedback") {
    const feedbackText = formData.get("feedbackText");

    if (!feedbackText || typeof feedbackText !== "string" || !feedbackText.trim()) {
      return { error: "Please add some feedback before submitting." };
    }

    // In the future, persist this to Prisma or another store.
    console.log("Reco feedback:", feedbackText.trim());

    return { feedbackResult: { ok: true } };
  }

  return null;
};

export default function Index() {
  const { metrics } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const isUploading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST" &&
    fetcher.formData?.get("_intent") === "upload-knowledge";

  const isSendingFeedback =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST" &&
    fetcher.formData?.get("_intent") === "feedback";

  useEffect(() => {
    if (fetcher.data && "uploadResult" in fetcher.data && fetcher.data.uploadResult) {
      const result = fetcher.data.uploadResult as { name: string; size: number };
      shopify.toast.show(`Uploaded business knowledge: ${result.name}`);
    }
    if (fetcher.data && "feedbackResult" in fetcher.data && fetcher.data.feedbackResult) {
      shopify.toast.show("Thanks for the feedback.");
    }
    if (fetcher.data && "error" in fetcher.data && fetcher.data.error) {
      shopify.toast.show(String(fetcher.data.error));
    }
  }, [fetcher.data, shopify]);

  const convSeries = metrics.last7Days.map((d) => d.conversations);
  const msgSeries = metrics.last7Days.map((d) => d.messages);
  const ratioSeries = metrics.last7Days.map((d) =>
    d.conversations > 0 ? d.messages / d.conversations : 0,
  );

  const makeSparkPoints = (values: number[]) => {
    if (!values.length) return "";
    const max = Math.max(...values, 1);
    const stepX = 100 / Math.max(values.length - 1, 1);
    return values
      .map((v, i) => {
        const x = i * stepX;
        const norm = v / max;
        const y = 100 - norm * 100;
        return `${x},${y}`;
      })
      .join(" ");
  };

  return (
    <s-page heading="Reco home & settings">
      {/* Analytics overview */}
      {/* Analytics overview */}
      <s-section heading="Live analytics">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "1rem",
          }}
        >
          {/* Total conversations */}
          <s-box padding="base" borderWidth="base" borderRadius="base" background="bg-surface">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <s-text as="p" tone="subdued" variant="bodyMd">
                  Total conversations
                </s-text>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                <span style={{ fontSize: "2.5rem", fontWeight: 700, lineHeight: 1 }}>
                  {metrics.totalConversations}
                </span>
                {/* Placeholder trend for Total (usually hard to calc from just 7 days without history) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "999px",
                    backgroundColor: "#ECFDF5", // Light green
                    color: "#059669", // Dark green
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: "0.875rem" }}>↑</span> 12%
                </div>
              </div>
            </div>
          </s-box>

          {/* Conversations today */}
          <s-box padding="base" borderWidth="base" borderRadius="base" background="bg-surface">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <s-text as="p" tone="subdued" variant="bodyMd">
                Conversations today
              </s-text>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                <span style={{ fontSize: "2.5rem", fontWeight: 700, lineHeight: 1 }}>
                  {metrics.conversationsToday}
                </span>
                {/* Calculate trend from last 2 days of series if available, else mock */}
                {(() => {
                  const len = convSeries.length;
                  const today = convSeries[len - 1] || 0;
                  const yesterday = convSeries[len - 2] || 0;
                  const diff = today - yesterday;
                  const isPositive = diff >= 0;
                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "999px",
                        backgroundColor: isPositive ? "#ECFDF5" : "#FEF2F2",
                        color: isPositive ? "#059669" : "#DC2626",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      <span style={{ fontSize: "0.875rem" }}>{isPositive ? "↑" : "↓"}</span>
                      {Math.abs(diff)} vs yest.
                    </div>
                  );
                })()}
              </div>
            </div>
          </s-box>

          {/* Avg messages per conversation */}
          <s-box padding="base" borderWidth="base" borderRadius="base" background="bg-surface">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <s-text as="p" tone="subdued" variant="bodyMd">
                Avg. messages / conversation
              </s-text>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                <span style={{ fontSize: "2.5rem", fontWeight: 700, lineHeight: 1 }}>
                  {metrics.avgMessagesPerConversation.toFixed(1)}
                </span>
                {/* Mock trend for avg */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "999px",
                    backgroundColor: "#ECFDF5",
                    color: "#059669",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: "0.875rem" }}>↑</span> 0.3
                </div>
              </div>
            </div>
          </s-box>

          {/* Messages today */}
          <s-box padding="base" borderWidth="base" borderRadius="base" background="bg-surface">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <s-text as="p" tone="subdued" variant="bodyMd">
                Messages today
              </s-text>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                <span style={{ fontSize: "2.5rem", fontWeight: 700, lineHeight: 1 }}>
                  {metrics.messagesToday}
                </span>
                {(() => {
                  const len = msgSeries.length;
                  const today = msgSeries[len - 1] || 0;
                  const yesterday = msgSeries[len - 2] || 0;
                  const diff = today - yesterday;
                  const isPositive = diff >= 0;
                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "999px",
                        backgroundColor: isPositive ? "#ECFDF5" : "#FEF2F2",
                        color: isPositive ? "#059669" : "#DC2626",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      <span style={{ fontSize: "0.875rem" }}>{isPositive ? "↑" : "↓"}</span>
                      {Math.abs(diff)} vs yest.
                    </div>
                  );
                })()}
              </div>
            </div>
          </s-box>
        </div>
      </s-section>

      {/* Data sources */}
      <s-section heading="Connect data sources">
        <s-stack direction="block" gap="base">
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="inline" gap="base" alignment="center">
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <img
                  src="/okendo-logo.png"
                  alt="Okendo"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <s-heading level="3">Okendo</s-heading>
            </s-stack>
            <s-paragraph tone="subdued">
              Import product reviews from Okendo to power rich, review-aware recommendations.
            </s-paragraph>
            <s-button onClick={() => shopify.toast.show("Okendo integration coming soon")}>
              Connect Okendo
            </s-button>
          </s-box>

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="inline" gap="base" alignment="center">
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <img
                  src="/judge me logo.png"
                  alt="Judge.me"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <s-heading level="3">Judge.me</s-heading>
            </s-stack>
            <s-paragraph tone="subdued">
              Connect Judge.me reviews as an alternative review source.
            </s-paragraph>
            <s-button onClick={() => shopify.toast.show("Judge.me integration coming soon")}>
              Connect Judge.me
            </s-button>
          </s-box>

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="inline" gap="base" alignment="center">
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "999px",
                  background: "#4b5563",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                S
              </div>
              <s-heading level="3">Stamped</s-heading>
            </s-stack>
            <s-paragraph tone="subdued">
              Connect Stamped reviews.
            </s-paragraph>
            <s-button onClick={() => shopify.toast.show("Stamped integration coming soon")}>
              Connect Stamped
            </s-button>
          </s-box>

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="inline" gap="base" alignment="center">
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "999px",
                  background: "#4b5563",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                Y
              </div>
              <s-heading level="3">Yotpo</s-heading>
            </s-stack>
            <s-paragraph tone="subdued">
              Connect Yotpo reviews.
            </s-paragraph>
            <s-button onClick={() => shopify.toast.show("Yotpo integration coming soon")}>
              Connect Yotpo
            </s-button>
          </s-box>

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="inline" gap="base" alignment="center">
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "999px",
                  background: "#4b5563",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                R
              </div>
              <s-heading level="3">Reviews.io</s-heading>
            </s-stack>
            <s-paragraph tone="subdued">
              Connect Reviews.io reviews.
            </s-paragraph>
            <s-button onClick={() => shopify.toast.show("Reviews.io integration coming soon")}>
              Connect Reviews.io
            </s-button>
          </s-box>

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="inline" gap="base" alignment="center">
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "999px",
                  background: "#4b5563",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                ★
              </div>
              <s-heading level="3">Other review platforms</s-heading>
            </s-stack>
            <s-paragraph tone="subdued">
              Hook up additional review providers in the future.
            </s-paragraph>
            <s-button onClick={() => shopify.toast.show("Custom review platform integration coming soon")}>
              Add integration
            </s-button>
          </s-box>
        </s-stack>
      </s-section>

      {/* Business knowledge upload (Hidden for now) */}
      {/* <s-section heading="Business knowledge upload">
        <s-paragraph tone="subdued">
          Upload internal docs, FAQs, and brand guidelines. We&apos;ll vectorize this content and use it to
          ground the agent&apos;s responses.
        </s-paragraph>

        <fetcher.Form method="post" encType="multipart/form-data">
          <input type="hidden" name="_intent" value="upload-knowledge" />
          <s-stack direction="inline" gap="base" alignment="center">
            <input type="file" name="knowledgeFile" />
            <s-button type="submit" {...(isUploading ? { loading: true } : {})}>
              Upload
            </s-button>
          </s-stack>
        </fetcher.Form>
      </s-section> */}

      {/* Feedback section */}
      <s-section heading="Feedback">
        <s-paragraph tone="subdued">
          Help us shape Reco. Share bugs, feature ideas, or anything that felt confusing while testing.
        </s-paragraph>
        <fetcher.Form method="post">
          <input type="hidden" name="_intent" value="feedback" />
          <s-stack direction="block" gap="base">
            <textarea
              name="feedbackText"
              rows={4}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--p-color-border-subdued, #e5e7eb)",
                resize: "vertical",
              }}
              placeholder="Tell us what&apos;s working well and what you&apos;d like to improve..."
            />
            <s-button type="submit" {...(isSendingFeedback ? { loading: true } : {})}>
              Send feedback
            </s-button>
          </s-stack>
        </fetcher.Form>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
