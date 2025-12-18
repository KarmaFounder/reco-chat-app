import { useLoaderData, useSubmit } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate, MONTHLY_PLAN } from "../shopify.server";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@react-router/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { billing } = await authenticate.admin(request);

    try {
        const billingCheck = await billing.require({
            plans: [MONTHLY_PLAN],
            isTest: true,
            onFailure: async () => {
                throw new Error("Not subscribed");
            },
        });

        // If we reach here, they have a subscription
        const subscription = billingCheck.appSubscriptions?.[0];

        return {
            hasActiveSubscription: true,
            subscriptionName: subscription?.name || MONTHLY_PLAN,
            subscriptionStatus: subscription?.status || "ACTIVE",
            subscriptionTest: subscription?.test || false,
        };
    } catch (error) {
        return {
            hasActiveSubscription: false,
        };
    }
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const { billing } = await authenticate.admin(request);
    const formData = await request.formData();
    const action = formData.get("action");

    if (action === "subscribe") {
        // billing.request returns a redirect response, so return it directly
        return await billing.request({
            plan: MONTHLY_PLAN,
            isTest: true,
            returnUrl: `https://${process.env.SHOPIFY_APP_URL}/app/subscription`,
        });
    }

    if (action === "cancel") {
        const billingCheck = await billing.require({ plans: [MONTHLY_PLAN], isTest: true, onFailure: async () => { } });
        const subscription = billingCheck.appSubscriptions?.[0];
        if (subscription) {
            await billing.cancel({
                subscriptionId: subscription.id,
                isTest: true,
                prorate: true,
            });
        }
        return { status: "cancelled" };
    }

    return null;
};

export default function Subscription() {
    const { hasActiveSubscription, subscriptionName, subscriptionStatus, subscriptionTest } = useLoaderData<typeof loader>();
    const submit = useSubmit();
    const shopify = useAppBridge();

    const handleSubscribe = () => {
        shopify.toast.show("Billing is currently disabled in development mode");
        // submit({ action: "subscribe" }, { method: "post" });
    };

    const handleCancel = () => {
        shopify.toast.show("Billing is currently disabled in development mode");
        // if (confirm("Are you sure you want to cancel your subscription?")) {
        //     submit({ action: "cancel" }, { method: "post" });
        // }
    };

    return (
        <s-page heading="Subscription">
            <s-section>
                <s-box padding="base" borderWidth="base" borderRadius="base" background="bg-surface">
                    <s-stack direction="block" gap="base">
                        <s-heading level="2">Current Plan</s-heading>

                        <s-banner tone="info" title="Development Mode">
                            <p>Billing actions are temporarily disabled in development mode.</p>
                            <p>The app is configured to work without an active subscription during testing.</p>
                        </s-banner>

                        {hasActiveSubscription ? (
                            <s-box padding="base" borderWidth="base" borderRadius="base" background="bg-surface-success">
                                <s-stack direction="block" gap="base">
                                    <s-banner tone="success" title="Active Subscription">
                                        <p>You are currently subscribed to the <strong>{subscriptionName}</strong>.</p>
                                        {subscriptionTest && <p>Test Mode: ON</p>}
                                    </s-banner>
                                    {/* <s-button variant="plain" tone="critical" onClick={handleCancel}>
                                        Cancel Subscription
                                    </s-button> */}
                                </s-stack>
                            </s-box>
                        ) : (
                            <s-box padding="base" borderWidth="base" borderRadius="base" background="bg-surface-warning">
                                <s-stack direction="block" gap="base">
                                    <s-banner tone="warning" title="No Active Subscription">
                                        <p>In production, access to Reco Chat AI requires an active subscription ($50/mo).</p>
                                    </s-banner>
                                    {/* <s-button variant="primary" onClick={handleSubscribe}>
                                        Subscribe for $50/mo
                                    </s-button> */}
                                </s-stack>
                            </s-box>
                        )}
                    </s-stack>
                </s-box>
            </s-section>
        </s-page>
    );
}
