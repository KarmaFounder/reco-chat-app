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
    { value: "demo", label: "Demo Reviews", description: "Use sample data for testing", logo: null },
    { value: "okendo", label: "Okendo", description: "Connect your Okendo reviews", logo: "/okendo-logo.png" },
    { value: "judge_me", label: "Judge.me", description: "Connect your Judge.me reviews", logo: "/judge me logo.png" },
    { value: "stamped", label: "Stamped", description: "Connect your Stamped reviews", logo: "/stamped-logo.jpeg" },
    { value: "yotpo", label: "Yotpo", description: "Connect your Yotpo reviews", logo: "/yotpo-logo.jpeg" },
    { value: "reviews_io", label: "Reviews.io", description: "Connect your Reviews.io reviews", logo: "/reviews-io-logo.jpg" },
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
                                    background: "#000000",
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
                                background: step >= n ? "#000000" : "#e5e7eb",
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
                                    background: step > n ? "#000000" : "#e5e7eb",
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
                                            boxSizing: "border-box",
                                            outline: "none",
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = "#000000"}
                                        onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
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
                                            boxSizing: "border-box",
                                            outline: "none",
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = "#000000"}
                                        onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
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
                                            boxSizing: "border-box",
                                            outline: "none",
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = "#000000"}
                                        onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
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
                                        background: canProceedStep1 ? "#000000" : "#e5e7eb",
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
                                            gap: "1rem",
                                            padding: "1rem",
                                            border: formState.review_provider === provider.value
                                                ? "2px solid #000000"
                                                : "1px solid #e5e7eb",
                                            borderRadius: "0.75rem",
                                            cursor: "pointer",
                                            background: formState.review_provider === provider.value ? "#f3f4f6" : "white",
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="review_provider"
                                            value={provider.value}
                                            checked={formState.review_provider === provider.value}
                                            onChange={(e) => handleInputChange("review_provider", e.target.value)}
                                            style={{ display: "none" }}
                                        />
                                        {/* Circle Logo Frame */}
                                        <div style={{
                                            width: "48px",
                                            height: "48px",
                                            borderRadius: "50%",
                                            background: provider.value === "demo" ? "#000000" : "#f3f4f6",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            overflow: "hidden",
                                            flexShrink: 0,
                                            border: "2px solid #e5e7eb",
                                        }}>
                                            {provider.logo ? (
                                                <img
                                                    src={provider.logo}
                                                    alt={provider.label}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        borderRadius: "50%",
                                                    }}
                                                />
                                            ) : (
                                                <span style={{
                                                    fontSize: provider.value === "demo" ? "1.25rem" : "1rem",
                                                    fontWeight: 700,
                                                    color: provider.value === "demo" ? "white" : "#6b7280",
                                                }}>
                                                    {provider.value === "demo" ? "✨" : provider.label.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        {/* Provider Info */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: "#111827" }}>{provider.label}</div>
                                            <div style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.125rem" }}>
                                                {provider.description}
                                            </div>
                                        </div>
                                        {/* Checkmark when selected */}
                                        {formState.review_provider === provider.value && (
                                            <div style={{
                                                width: "24px",
                                                height: "24px",
                                                borderRadius: "50%",
                                                background: "#000000",
                                                color: "white",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "0.875rem",
                                            }}>
                                                ✓
                                            </div>
                                        )}
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
                                        background: canProceedStep2 ? "#000000" : "#e5e7eb",
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
                                    <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
                                        You've selected demo mode. We'll use sample reviews to power your widget.
                                        You can connect a real review platform later from your settings.
                                    </p>

                                    {/* Demo Reviews Connected Card */}
                                    <div style={{
                                        padding: "1.5rem",
                                        background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
                                        borderRadius: "0.75rem",
                                        border: "1px solid #bbf7d0",
                                        marginBottom: "1.5rem",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                                            <div style={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius: "50%",
                                                background: "#22c55e",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "white",
                                                fontSize: "1.5rem",
                                            }}>
                                                ✓
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: "#166534", fontSize: "1.125rem" }}>
                                                    Demo Reviews Connected
                                                </div>
                                                <div style={{ color: "#166534", fontSize: "0.875rem" }}>
                                                    50+ sample reviews ready to use
                                                </div>
                                            </div>
                                        </div>
                                        <p style={{ margin: 0, color: "#166534", fontSize: "0.875rem" }}>
                                            Your widget will work immediately with sample product reviews.
                                            Shopify reviewers can test the full experience.
                                        </p>
                                    </div>

                                    {/* Info about what's included */}
                                    <div style={{
                                        padding: "1rem",
                                        background: "#f9fafb",
                                        borderRadius: "0.5rem",
                                        border: "1px solid #e5e7eb",
                                    }}>
                                        <div style={{ fontWeight: 600, marginBottom: "0.5rem", color: "#374151" }}>
                                            Demo includes:
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#6b7280", fontSize: "0.875rem" }}>
                                            <li>Sample product reviews with real-looking data</li>
                                            <li>AI-powered Q&A responses</li>
                                            <li>All widget features enabled</li>
                                        </ul>
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
                                                boxSizing: "border-box",
                                                outline: "none",
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = "#000000"}
                                            onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
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
                                        background: "#000000",
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
