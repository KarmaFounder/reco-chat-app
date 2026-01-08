/**
 * Feedback Page - User feedback form (moved from Home)
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

export default function Feedback() {
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
        <s-page heading="Feedback">
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
                                    border: "1px solid #e5e7eb",
                                    resize: "vertical",
                                    fontSize: "1rem",
                                    boxSizing: "border-box",
                                }}
                                placeholder="Tell us what's working well and what you'd like to improve..."
                            />
                            <s-button type="submit" {...(isSendingFeedback ? { loading: true } : {})}>
                                Send feedback
                            </s-button>
                        </s-stack>
                    </fetcher.Form>
                </s-box>

                <s-box padding="base" borderWidth="base" borderRadius="base" style={{ marginTop: "1rem" }}>
                    <s-heading>Quick links</s-heading>
                    <s-paragraph tone="subdued" style={{ marginBottom: "0.75rem" }}>
                        Other ways to get help
                    </s-paragraph>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        <s-button onClick={() => window.open("mailto:support@getreco.ai", "_blank")}>
                            📧 Email Support
                        </s-button>
                        <s-button onClick={() => shopify.toast.show("Documentation coming soon!")}>
                            📚 Documentation
                        </s-button>
                    </div>
                </s-box>
            </s-section>
        </s-page>
    );
}
