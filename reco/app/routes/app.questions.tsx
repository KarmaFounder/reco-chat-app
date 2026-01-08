/**
 * Questions Page - Live questions from the widget
 */
import { useState, useEffect } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { getClient, api } from "../convex.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);

    let questions: any[] = [];
    const client = getClient();

    if (client) {
        try {
            // Try to get real questions from Convex
            const result = await client.query(api.questions.listQuestions, {
                shopify_domain: session.shop,
                limit: 50,
            });
            questions = result || [];
        } catch (e) {
            console.warn("Failed to fetch questions:", e);
        }
    }

    // If no real questions, use demo data
    if (!questions.length) {
        questions = [
            {
                _id: "1",
                question: "What do tall buyers say about the fit?",
                answer: "Based on customer reviews, tall customers (5'9\"+) generally find the torso length adequate. Some prefer the long-torso version for extra coverage.",
                createdAt: Date.now() - 1000 * 60 * 30, // 30 mins ago
                product: "Seamless Sculpt Brief Bodysuit",
            },
            {
                _id: "2",
                question: "Does the fabric pill after washing?",
                answer: "Reviews indicate the fabric holds up well. Following care instructions (cold wash, lay flat to dry) helps maintain quality.",
                createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
                product: "Cotton Jersey T-Shirt",
            },
            {
                _id: "3",
                question: "Is it good for daily wear?",
                answer: "Yes! Many reviewers mention wearing it for 8+ hours with no discomfort. The seamless design prevents digging or rolling.",
                createdAt: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
                product: "Fits Everybody T-Shirt Bra",
            },
            {
                _id: "4",
                question: "Is this supportive enough for larger busts?",
                answer: "D+ cup reviewers report good support for light to moderate activity. For high-impact activities, consider the structured styles.",
                createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
                product: "Fits Everybody Plunge Bra",
            },
            {
                _id: "5",
                question: "Does it show under clothes?",
                answer: "The seamless construction and thin fabric make it virtually invisible under most clothing. Light colors work best under white tops.",
                createdAt: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
                product: "Soft Smoothing Seamless Brief",
            },
        ];
    }

    return { questions, shop: session.shop };
};

export default function Questions() {
    const { questions } = useLoaderData<typeof loader>();
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

                    {/* Questions List - Fixed width container */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
