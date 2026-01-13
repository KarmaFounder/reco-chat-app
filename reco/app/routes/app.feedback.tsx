/**
 * Support Page - Quick links and user feedback form
 */
import { useEffect } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    await authenticate.admin(request);
    const formData = await request.formData();
    const feedbackText = formData.get("feedbackText");

    if (!feedbackText || typeof feedbackText !== "string" || !feedbackText.trim()) {
        return { error: "Please add some feedback before submitting." };
    }

    // In the future, persist this to Prisma or Convex
    console.log("Reco feedback:", feedbackText.trim());

    return { feedbackResult: { ok: true } };
};

// Icons as components
const MailIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

export default function Support() {
    const fetcher = useFetcher<typeof action>();
    const shopify = useAppBridge();

    const isSendingFeedback =
        ["loading", "submitting"].includes(fetcher.state) &&
        fetcher.formMethod === "POST";

    useEffect(() => {
        if (fetcher.data && "feedbackResult" in fetcher.data && fetcher.data.feedbackResult) {
            shopify.toast.show("Thanks for the feedback!");
        }
        if (fetcher.data && "error" in fetcher.data && fetcher.data.error) {
            shopify.toast.show(String(fetcher.data.error));
        }
    }, [fetcher.data, shopify]);

    return (
        <s-page heading="Support">
            {/* Quick Links at top */}
            <s-section>
                <s-box padding="base" borderWidth="base" borderRadius="base">
                    <s-heading>Quick links</s-heading>
                    <s-paragraph tone="subdued" style={{ marginBottom: "1rem" }}>
                        Get help with Reco
                    </s-paragraph>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        <button
                            onClick={() => window.open("mailto:support@getreco.ai", "_blank")}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.625rem 1rem",
                                background: "white",
                                border: "1px solid #e5e7eb",
                                borderRadius: "0.5rem",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                            }}
                        >
                            <MailIcon /> Email Support
                        </button>
                    </div>
                </s-box>
            </s-section>

            {/* Feedback form below */}
            <s-section>
                <s-box padding="base" borderWidth="base" borderRadius="base">
                    <div style={{ marginBottom: "1rem" }}>
                        <s-heading>Help us improve Reco</s-heading>
                        <s-paragraph tone="subdued">
                            Share bugs, feature ideas, or anything that felt confusing while using Reco.
                        </s-paragraph>
                    </div>

                    <fetcher.Form method="post">
                        <s-stack direction="block" gap="base">
                            <textarea
                                name="feedbackText"
                                rows={6}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "2px solid #000000",
                                    resize: "vertical",
                                    fontSize: "1rem",
                                    fontFamily: "inherit",
                                    boxSizing: "border-box",
                                    outline: "none",
                                }}
                                placeholder="Tell us what's working well and what you'd like to improve..."
                            />
                            <s-button type="submit" {...(isSendingFeedback ? { loading: true } : {})}>
                                Send feedback
                            </s-button>
                        </s-stack>
                    </fetcher.Form>
                </s-box>
            </s-section>
        </s-page>
    );
}
