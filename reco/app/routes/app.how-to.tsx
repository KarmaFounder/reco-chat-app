import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    return { shop: session.shop };
};

export default function HowTo() {
    const { shop } = useLoaderData<typeof loader>();

    const steps = [
        {
            number: 1,
            title: "Go to Your Theme Editor",
            description: "In your Shopify admin, go to Online Store → Themes → Customize",
            tip: "Make sure you're editing your live theme or a draft you plan to publish.",
        },
        {
            number: 2,
            title: "Navigate to a Product Page",
            description: "In the theme editor, use the page dropdown at the top to select 'Products' → 'Default product'",
            tip: "The Reco widget is designed to appear on product pages where customers need help deciding.",
        },
        {
            number: 3,
            title: "Add the Reco Block",
            description: "In the left sidebar, click 'Add block' under Product Information, then select 'App' → 'Reco Chat Widget'",
            tip: "You can drag the block to position it where you want on the page.",
        },
        {
            number: 4,
            title: "Save Your Changes",
            description: "Click 'Save' in the top right corner to publish the widget to your store.",
            tip: "The widget will now appear on all product pages!",
        },
    ];

    return (
        <s-page heading="How to Install Reco">
            <s-section>
                <s-paragraph tone="subdued">
                    Follow these steps to add the Reco chat widget to your product pages.
                    The widget helps customers find the perfect product by answering questions based on reviews.
                </s-paragraph>
            </s-section>

            <s-section heading="Installation Steps">
                <s-stack direction="block" gap="large">
                    {steps.map((step) => (
                        <s-box
                            key={step.number}
                            padding="large"
                            borderWidth="base"
                            borderRadius="base"
                        >
                            <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                                <div style={{
                                    width: "3rem",
                                    height: "3rem",
                                    borderRadius: "50%",
                                    background: "#000000",
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    fontSize: "1.25rem",
                                    flexShrink: 0,
                                }}>
                                    {step.number}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <s-heading level="3">{step.title}</s-heading>
                                    <s-paragraph style={{ marginTop: "0.5rem" }}>
                                        {step.description}
                                    </s-paragraph>
                                    <div style={{
                                        marginTop: "0.75rem",
                                        padding: "0.75rem",
                                        background: "#f3f4f6",
                                        borderRadius: "0.5rem",
                                        fontSize: "0.875rem",
                                        color: "#374151"
                                    }}>
                                        💡 <strong>Tip:</strong> {step.tip}
                                    </div>
                                </div>
                            </div>
                        </s-box>
                    ))}
                </s-stack>
            </s-section>

            <s-section heading="Quick Links">
                <s-stack direction="inline" gap="base">
                    <a
                        href={`https://${shop}/admin/themes/current/editor`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.75rem 1.5rem",
                            background: "#000000",
                            color: "white",
                            borderRadius: "0.5rem",
                            textDecoration: "none",
                            fontWeight: 600,
                        }}
                    >
                        Open Theme Editor →
                    </a>
                </s-stack>
            </s-section>

            <s-section heading="Need Help?">
                <s-box padding="base" borderWidth="base" borderRadius="base">
                    <s-paragraph>
                        If you're having trouble installing the widget, please reach out to us:
                    </s-paragraph>
                    <ul style={{ marginTop: "0.75rem", paddingLeft: "1.5rem" }}>
                        <li>Email: <a href="mailto:support@askreco.com">support@askreco.com</a></li>
                        <li>Check our <a href="/landing" target="_blank">landing page</a> for more information</li>
                    </ul>
                </s-box>
            </s-section>

            <s-section heading="What Customers See">
                <s-box padding="base" borderWidth="base" borderRadius="base">
                    <s-paragraph tone="subdued">
                        Once installed, customers will see a chat widget on your product pages.
                        They can ask questions like:
                    </s-paragraph>
                    <ul style={{ marginTop: "0.75rem", paddingLeft: "1.5rem" }}>
                        <li>"What do tall buyers say about the fit?"</li>
                        <li>"Does the fabric pill?"</li>
                        <li>"Is it good for daily wear?"</li>
                    </ul>
                    <s-paragraph style={{ marginTop: "1rem" }}>
                        Reco answers using real customer reviews, helping shoppers make confident purchase decisions.
                    </s-paragraph>
                </s-box>
            </s-section>
        </s-page>
    );
}

export const headers: HeadersFunction = (headersArgs) => {
    return boundary.headers(headersArgs);
};
