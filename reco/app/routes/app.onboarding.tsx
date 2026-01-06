import { useState } from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getClient, api } from "../convex.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);

    // Check onboarding status
    const client = getClient();
    let onboardingData = null;

    if (client) {
        try {
            onboardingData = await client.query(api.onboarding.getOnboardingData, {
                shopify_domain: session.shop,
            });
        } catch (e) {
            console.error("Failed to get onboarding data:", e);
        }
    }

    return {
        shop: session.shop,
        onboardingData,
    };
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const intent = formData.get("_intent");

    const client = getClient();
    if (!client) {
        return { error: "Convex not configured" };
    }

    if (intent === "complete_onboarding") {
        try {
            await client.mutation(api.onboarding.completeOnboarding, {
                shopify_domain: session.shop,
                contact_name: String(formData.get("contact_name") || ""),
                contact_email: String(formData.get("contact_email") || ""),
                brand_name: String(formData.get("brand_name") || ""),
                review_provider: String(formData.get("review_provider") || "demo"),
                review_api_key: formData.get("review_api_key") ? String(formData.get("review_api_key")) : undefined,
            });
            return { success: true, redirect: "/app" };
        } catch (e: any) {
            return { error: e.message || "Failed to complete onboarding" };
        }
    }

    if (intent === "reset_onboarding") {
        try {
            await client.mutation(api.onboarding.resetOnboarding, {
                shopify_domain: session.shop,
            });
            return { reset: true };
        } catch (e: any) {
            return { error: e.message || "Failed to reset onboarding" };
        }
    }

    return null;
};

const REVIEW_PROVIDERS = [
    { value: "demo", label: "Use Demo Reviews (for testing)" },
    { value: "okendo", label: "Okendo" },
    { value: "judge_me", label: "Judge.me" },
    { value: "stamped", label: "Stamped" },
    { value: "yotpo", label: "Yotpo" },
    { value: "reviews_io", label: "Reviews.io" },
];

export default function Onboarding() {
    const { shop, onboardingData } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [step, setStep] = useState(1);
    const [formState, setFormState] = useState({
        contact_name: onboardingData?.contact_name || "",
        contact_email: onboardingData?.contact_email || "",
        brand_name: onboardingData?.brand_name || shop.replace(".myshopify.com", ""),
        review_provider: onboardingData?.review_provider || "demo",
        review_api_key: "",
    });

    // If already onboarded and action redirected, show success
    if (actionData?.success) {
        return (
            <s-page heading="Welcome to Reco!">
                <s-section>
                    <s-box padding="large" borderWidth="base" borderRadius="base" background="bg-surface">
                        <div style={{ textAlign: "center", padding: "2rem" }}>
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
                            <s-heading level="2">Setup Complete!</s-heading>
                            <s-paragraph style={{ marginTop: "1rem" }}>
                                Your Reco widget is ready. Head to the Home page to see your analytics.
                            </s-paragraph>
                            <div style={{ marginTop: "1.5rem" }}>
                                <a href="/app" style={{
                                    padding: "0.75rem 1.5rem",
                                    background: "#6366f1",
                                    color: "white",
                                    borderRadius: "0.5rem",
                                    textDecoration: "none",
                                    fontWeight: 600
                                }}>
                                    Go to Dashboard →
                                </a>
                            </div>
                        </div>
                    </s-box>
                </s-section>
            </s-page>
        );
    }

    // If already completed onboarding, show status with reset option
    if (onboardingData?.onboarding_completed && !actionData?.reset) {
        return (
            <s-page heading="Account Settings">
                <s-section heading="Your Account">
                    <s-box padding="base" borderWidth="base" borderRadius="base">
                        <div style={{ display: "grid", gap: "0.75rem" }}>
                            <div><strong>Contact Name:</strong> {onboardingData.contact_name}</div>
                            <div><strong>Email:</strong> {onboardingData.contact_email}</div>
                            <div><strong>Brand:</strong> {onboardingData.brand_name}</div>
                            <div><strong>Review Provider:</strong> {onboardingData.review_provider}</div>
                            <div><strong>API Key:</strong> {onboardingData.has_api_key ? "••••••••" : "Not set"}</div>
                        </div>
                    </s-box>
                </s-section>

                <s-section heading="Demo Mode">
                    <s-paragraph tone="subdued">
                        Want to see the onboarding wizard again? Reset your onboarding to demo the flow.
                    </s-paragraph>
                    <Form method="post">
                        <input type="hidden" name="_intent" value="reset_onboarding" />
                        <s-button type="submit" tone="critical" {...(isSubmitting ? { loading: true } : {})}>
                            Reset Onboarding (Demo)
                        </s-button>
                    </Form>
                </s-section>
            </s-page>
        );
    }

    const handleInputChange = (field: string, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 3));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const canProceedStep1 = formState.contact_name && formState.contact_email && formState.brand_name;
    const canProceedStep2 = formState.review_provider;

    return (
        <s-page heading="Welcome to Reco">
            <s-section>
                {/* Progress indicator */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", alignItems: "center" }}>
                    {[1, 2, 3].map((n) => (
                        <div key={n} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{
                                width: "2rem",
                                height: "2rem",
                                borderRadius: "50%",
                                background: step >= n ? "#6366f1" : "#e5e7eb",
                                color: step >= n ? "white" : "#6b7280",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                            }}>
                                {n}
                            </div>
                            {n < 3 && (
                                <div style={{
                                    width: "3rem",
                                    height: "2px",
                                    background: step > n ? "#6366f1" : "#e5e7eb",
                                }} />
                            )}
                        </div>
                    ))}
                    <span style={{ marginLeft: "0.5rem", color: "#6b7280", fontSize: "0.875rem" }}>
                        Step {step} of 3
                    </span>
                </div>

                <s-box padding="large" borderWidth="base" borderRadius="base" background="bg-surface">
                    {/* Step 1: Contact Info */}
                    {step === 1 && (
                        <div>
                            <s-heading level="2">Tell us about yourself</s-heading>
                            <s-paragraph tone="subdued" style={{ marginBottom: "1.5rem" }}>
                                We'll use this to personalize your experience and keep you updated.
                            </s-paragraph>

                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                        Your Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.contact_name}
                                        onChange={(e) => handleInputChange("contact_name", e.target.value)}
                                        placeholder="John Smith"
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "0.5rem",
                                            fontSize: "1rem",
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        value={formState.contact_email}
                                        onChange={(e) => handleInputChange("contact_email", e.target.value)}
                                        placeholder="john@yourbrand.com"
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "0.5rem",
                                            fontSize: "1rem",
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                        Brand Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.brand_name}
                                        onChange={(e) => handleInputChange("brand_name", e.target.value)}
                                        placeholder="Your Brand"
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "0.5rem",
                                            fontSize: "1rem",
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={!canProceedStep1}
                                    style={{
                                        padding: "0.75rem 2rem",
                                        background: canProceedStep1 ? "#6366f1" : "#e5e7eb",
                                        color: canProceedStep1 ? "white" : "#9ca3af",
                                        border: "none",
                                        borderRadius: "0.5rem",
                                        fontWeight: 600,
                                        cursor: canProceedStep1 ? "pointer" : "not-allowed",
                                    }}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Review Provider */}
                    {step === 2 && (
                        <div>
                            <s-heading level="2">Connect Your Reviews</s-heading>
                            <s-paragraph tone="subdued" style={{ marginBottom: "1.5rem" }}>
                                Select your review platform to power Reco's AI recommendations.
                            </s-paragraph>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {REVIEW_PROVIDERS.map((provider) => (
                                    <label
                                        key={provider.value}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.75rem",
                                            padding: "1rem",
                                            border: formState.review_provider === provider.value
                                                ? "2px solid #6366f1"
                                                : "1px solid #e5e7eb",
                                            borderRadius: "0.5rem",
                                            cursor: "pointer",
                                            background: formState.review_provider === provider.value ? "#f5f3ff" : "white",
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="review_provider"
                                            value={provider.value}
                                            checked={formState.review_provider === provider.value}
                                            onChange={(e) => handleInputChange("review_provider", e.target.value)}
                                        />
                                        <span style={{ fontWeight: 500 }}>{provider.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between" }}>
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    style={{
                                        padding: "0.75rem 1.5rem",
                                        background: "white",
                                        color: "#6b7280",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "0.5rem",
                                        fontWeight: 500,
                                        cursor: "pointer",
                                    }}
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={!canProceedStep2}
                                    style={{
                                        padding: "0.75rem 2rem",
                                        background: canProceedStep2 ? "#6366f1" : "#e5e7eb",
                                        color: canProceedStep2 ? "white" : "#9ca3af",
                                        border: "none",
                                        borderRadius: "0.5rem",
                                        fontWeight: 600,
                                        cursor: canProceedStep2 ? "pointer" : "not-allowed",
                                    }}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: API Key (if not demo) */}
                    {step === 3 && (
                        <Form method="post">
                            <input type="hidden" name="_intent" value="complete_onboarding" />
                            <input type="hidden" name="contact_name" value={formState.contact_name} />
                            <input type="hidden" name="contact_email" value={formState.contact_email} />
                            <input type="hidden" name="brand_name" value={formState.brand_name} />
                            <input type="hidden" name="review_provider" value={formState.review_provider} />

                            <s-heading level="2">
                                {formState.review_provider === "demo" ? "Ready to Go!" : "Connect Your API"}
                            </s-heading>

                            {formState.review_provider === "demo" ? (
                                <div>
                                    <s-paragraph tone="subdued" style={{ marginBottom: "1.5rem" }}>
                                        You've selected demo mode. We'll use sample reviews to power your widget.
                                        You can connect a real review platform later from your settings.
                                    </s-paragraph>

                                    <div style={{
                                        padding: "1rem",
                                        background: "#f0fdf4",
                                        borderRadius: "0.5rem",
                                        border: "1px solid #bbf7d0",
                                        marginBottom: "1.5rem"
                                    }}>
                                        <strong>✓ Demo Reviews Ready</strong>
                                        <p style={{ margin: "0.5rem 0 0", color: "#166534" }}>
                                            Your widget will work immediately with sample data.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <s-paragraph tone="subdued" style={{ marginBottom: "1.5rem" }}>
                                        Enter your {REVIEW_PROVIDERS.find(p => p.value === formState.review_provider)?.label} API key to import your reviews.
                                    </s-paragraph>

                                    <div>
                                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                                            API Key
                                        </label>
                                        <input
                                            type="password"
                                            name="review_api_key"
                                            value={formState.review_api_key}
                                            onChange={(e) => handleInputChange("review_api_key", e.target.value)}
                                            placeholder="Enter your API key"
                                            style={{
                                                width: "100%",
                                                padding: "0.75rem",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "0.5rem",
                                                fontSize: "1rem",
                                            }}
                                        />
                                        <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.5rem" }}>
                                            You can skip this and add it later from settings.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {actionData?.error && (
                                <div style={{
                                    padding: "1rem",
                                    background: "#fef2f2",
                                    borderRadius: "0.5rem",
                                    border: "1px solid #fecaca",
                                    marginTop: "1rem",
                                    color: "#dc2626"
                                }}>
                                    {actionData.error}
                                </div>
                            )}

                            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between" }}>
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    style={{
                                        padding: "0.75rem 1.5rem",
                                        background: "white",
                                        color: "#6b7280",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "0.5rem",
                                        fontWeight: 500,
                                        cursor: "pointer",
                                    }}
                                >
                                    ← Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        padding: "0.75rem 2rem",
                                        background: "#6366f1",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "0.5rem",
                                        fontWeight: 600,
                                        cursor: isSubmitting ? "wait" : "pointer",
                                        opacity: isSubmitting ? 0.7 : 1,
                                    }}
                                >
                                    {isSubmitting ? "Setting up..." : "Complete Setup ✓"}
                                </button>
                            </div>
                        </Form>
                    )}
                </s-box>
            </s-section>
        </s-page>
    );
}

export const headers: HeadersFunction = (headersArgs) => {
    return boundary.headers(headersArgs);
};
