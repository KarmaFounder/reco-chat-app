/**
 * Questions Page - Live questions from the widget
 */
import { useState, useEffect } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { getClient, api } from "../convex.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    try {
        const { session } = await authenticate.admin(request);

        let questions: any[] = [];
        let debugInfo = { clientExists: false, error: null as string | null, shopDomain: session.shop };
        const client = getClient();

        if (client) {
            debugInfo.clientExists = true;
            try {
                // Try to get real questions from Convex
                const result = await client.query(api.questions.listQuestions, {
                    shopify_domain: session.shop,
                    limit: 50,
                });
                questions = result || [];
            } catch (e: any) {
                debugInfo.error = e?.message || String(e);
                console.warn("Failed to fetch questions:", e);
            }
        }

        // NO DEMO FALLBACK - show real data only
        return { questions, shop: session.shop, debugInfo };
    } catch (e: any) {
        console.error("Questions loader error:", e);
        // Return a valid response instead of throwing
        return {
            questions: [],
            shop: "unknown",
            debugInfo: {
                clientExists: false,
                error: `Loader error: ${e?.message || String(e)}`,
                shopDomain: "unknown"
            }
        };
    }
};

export default function Questions() {
    const { questions, debugInfo, shop } = useLoaderData<typeof loader>();
    const [dateFilter, setDateFilter] = useState("all");
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };


    // Filter questions by date
    const filteredQuestions = questions.filter((q: any) => {
        const now = Date.now();
        const createdAt = q.createdAt || q._creationTime || now;
        const diffMs = now - createdAt;
        const diffHours = diffMs / (1000 * 60 * 60);
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        switch (dateFilter) {
            case "24h": return diffHours <= 24;
            case "7d": return diffDays <= 7;
            case "30d": return diffDays <= 30;
            default: return true;
        }
    });

    // Helper to clean author name from various formats
    const cleanAuthor = (author: any): string => {
        if (!author) return "Anonymous";
        if (typeof author === "string") {
            // Check if it's a JSON string
            if (author.startsWith("{") || author.startsWith("[")) {
                try {
                    const parsed = JSON.parse(author.replace(/'/g, '"'));
                    return parsed.displayName || parsed.author_name || parsed.reviewer || "Anonymous";
                } catch {
                    // Try to extract displayName with regex
                    const match = author.match(/'displayName':\s*'([^']+)'/);
                    return match ? match[1] : author.slice(0, 50);
                }
            }
            return author;
        }
        if (typeof author === "object") {
            return author.displayName || author.author_name || author.reviewer || author.name || "Anonymous";
        }
        return String(author).slice(0, 50);
    };

    // Helper to clean review body
    const cleanReviewBody = (body: any): string => {
        if (!body) return "No review text";
        if (typeof body === "string") return body;
        if (typeof body === "object" && body.review_body) return body.review_body;
        return String(body).slice(0, 200);
    };


    // Icon components
    const ChevronDownIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
        </svg>
    );

    const ChevronUpIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m18 15-6-6-6 6" />
        </svg>
    );

    return (
        <s-page heading="Customer Questions">
            <s-section>
                <s-box padding="base" borderWidth="base" borderRadius="base">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <div>
                            <s-heading>Questions Asked</s-heading>
                            <s-paragraph>
                                See what customers are asking about your products
                            </s-paragraph>
                        </div>

                        {/* Date Filter */}
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            {[
                                { value: "24h", label: "24h" },
                                { value: "7d", label: "7 days" },
                                { value: "30d", label: "30 days" },
                                { value: "all", label: "All time" },
                            ].map((filter) => (
                                <button
                                    key={filter.value}
                                    onClick={() => setDateFilter(filter.value)}
                                    style={{
                                        padding: "0.5rem 1rem",
                                        borderRadius: "0.5rem",
                                        border: "1px solid #e5e7eb",
                                        background: dateFilter === filter.value ? "#000000" : "white",
                                        color: dateFilter === filter.value ? "white" : "#374151",
                                        fontSize: "0.875rem",
                                        fontWeight: 500,
                                        cursor: "pointer",
                                    }}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Debug Info - only show if no questions */}
                    {questions.length === 0 && (
                        <div style={{
                            padding: "2rem",
                            background: "#fef3c7",
                            borderRadius: "0.5rem",
                            marginBottom: "1rem",
                            fontSize: "0.875rem",
                        }}>
                            <strong>No questions found.</strong>
                            <br />
                            <span style={{ color: "#92400e" }}>
                                Shop: {shop || "unknown"}<br />
                                Convex client: {debugInfo?.clientExists ? "✅ Connected" : "❌ Not connected"}<br />
                                {debugInfo?.error && <>Error: {debugInfo.error}</>}
                            </span>
                            <br /><br />
                            <em>Ask a question in the widget on your store, then refresh this page.</em>
                        </div>
                    )}

                    {/* Questions List - Fixed width container */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {filteredQuestions.length === 0 && questions.length > 0 && (
                            <div style={{
                                padding: "1.5rem",
                                textAlign: "center",
                                color: "#6b7280",
                            }}>
                                No questions match the selected filter.
                            </div>
                        )}
                        {filteredQuestions.map((q: any) => (
                            <div
                                key={q._id}
                                style={{
                                    padding: "1rem",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "0.75rem",
                                    background: expandedQuestion === q._id ? "#f9fafb" : "white",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div style={{ flex: 1, minWidth: 0, paddingRight: "1rem" }}>
                                        <div style={{
                                            fontWeight: 600,
                                            color: "#111827",
                                            fontSize: "1rem",
                                        }}>
                                            "{q.question}"
                                        </div>
                                        <div style={{
                                            fontSize: "0.75rem",
                                            color: "#6b7280",
                                            marginTop: "0.25rem",
                                        }}>
                                            {q.product} • {formatDate(q.createdAt || q._creationTime || Date.now())}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setExpandedQuestion(expandedQuestion === q._id ? null : q._id)}
                                        style={{
                                            padding: "0.5rem 1rem",
                                            borderRadius: "0.5rem",
                                            border: "1px solid #000000",
                                            background: expandedQuestion === q._id ? "#000000" : "white",
                                            color: expandedQuestion === q._id ? "white" : "#000000",
                                            fontSize: "0.75rem",
                                            fontWeight: 500,
                                            cursor: "pointer",
                                            whiteSpace: "nowrap",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.25rem",
                                            flexShrink: 0,
                                            minWidth: "110px",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {expandedQuestion === q._id ? (
                                            <>Hide Answer <ChevronUpIcon /></>
                                        ) : (
                                            <>View Answer <ChevronDownIcon /></>
                                        )}
                                    </button>
                                </div>

                                {/* Expanded Answer */}
                                {expandedQuestion === q._id && (
                                    <div style={{
                                        marginTop: "1rem",
                                        padding: "1rem",
                                        background: "white",
                                        borderRadius: "0.5rem",
                                        border: "1px solid #e5e7eb",
                                    }}>
                                        <div style={{
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            color: "#6b7280",
                                            marginBottom: "0.5rem",
                                        }}>
                                            AI ANSWER:
                                        </div>
                                        <div style={{
                                            fontSize: "0.875rem",
                                            color: "#374151",
                                            lineHeight: 1.6,
                                        }}>
                                            {q.answer}
                                        </div>

                                        {/* Source Reviews - Horizontal Scrollable Cards */}
                                        {q.sources && q.sources.length > 0 && (
                                            <div style={{ marginTop: "1rem" }}>
                                                <div style={{
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600,
                                                    color: "#6b7280",
                                                    marginBottom: "0.5rem",
                                                }}>
                                                    REVIEWS USED:
                                                </div>
                                                <div style={{
                                                    display: "flex",
                                                    gap: "0.75rem",
                                                    overflowX: "auto",
                                                    paddingBottom: "0.5rem",
                                                }}>
                                                    {q.sources.map((source: any, idx: number) => (
                                                        <div
                                                            key={idx}
                                                            style={{
                                                                flexShrink: 0,
                                                                width: "200px",
                                                                padding: "0.75rem",
                                                                background: "#f9fafb",
                                                                borderRadius: "0.5rem",
                                                                border: "1px solid #e5e7eb",
                                                            }}
                                                        >
                                                            <div style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                                marginBottom: "0.25rem",
                                                            }}>
                                                                <span style={{
                                                                    fontSize: "0.75rem",
                                                                    fontWeight: 600,
                                                                    color: "#111827",
                                                                }}>
                                                                    {cleanAuthor(source.author)}
                                                                </span>
                                                                <span style={{ fontSize: "0.75rem", color: "#f59e0b" }}>
                                                                    {"★".repeat(source.rating || 5)}
                                                                </span>
                                                            </div>
                                                            <p style={{
                                                                fontSize: "0.75rem",
                                                                color: "#6b7280",
                                                                lineHeight: 1.4,
                                                                margin: 0,
                                                                overflow: "hidden",
                                                                display: "-webkit-box",
                                                                WebkitLineClamp: 3,
                                                                WebkitBoxOrient: "vertical" as any,
                                                            }}>
                                                                {cleanReviewBody(source.review_body)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{
                        marginTop: "1.5rem",
                        padding: "1rem",
                        background: "#f9fafb",
                        borderRadius: "0.5rem",
                        textAlign: "center",
                        color: "#6b7280",
                        fontSize: "0.875rem",
                    }}>
                        Showing {filteredQuestions.length} of {questions.length} questions
                    </div>
                </s-box>
            </s-section>
        </s-page>
    );
}
