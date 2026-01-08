/**
 * Questions Page - Shows questions users are asking with date filter
 */
import { useState } from "react";

export default function Questions() {
    const [dateFilter, setDateFilter] = useState("7d");
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

    // Demo data - would come from Convex in production
    const questions = [
        {
            id: "1",
            question: "Does this run true to size?",
            answer: "Based on customer reviews, this product runs slightly small. We recommend sizing up if you're between sizes.",
            timestamp: "2026-01-08T14:30:00Z",
            product: "Seamless Sculpt Brief Bodysuit",
        },
        {
            id: "2",
            question: "Is this comfortable for all-day wear?",
            answer: "Yes! Many reviewers mention wearing it for 8+ hours with no discomfort. The seamless design prevents digging or rolling.",
            timestamp: "2026-01-08T13:15:00Z",
            product: "Fits Everybody T-Shirt Bra",
        },
        {
            id: "3",
            question: "What do tall buyers say about the fit?",
            answer: "Tall customers (5'9\"+) generally find the torso length adequate. Some prefer the long-torso version for extra coverage.",
            timestamp: "2026-01-08T11:45:00Z",
            product: "Soft Smoothing Seamless Brief",
        },
        {
            id: "4",
            question: "Does the fabric pill after washing?",
            answer: "Reviews indicate the fabric holds up well. Following care instructions (cold wash, lay flat to dry) helps maintain quality.",
            timestamp: "2026-01-07T16:20:00Z",
            product: "Cotton Jersey T-Shirt",
        },
        {
            id: "5",
            question: "Is this supportive enough for larger busts?",
            answer: "D+ cup reviewers report good support for light to moderate activity. For high-impact activities, consider the structured styles.",
            timestamp: "2026-01-07T10:00:00Z",
            product: "Fits Everybody Plunge Bra",
        },
    ];

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <s-page title="Customer Questions">
            <s-layout>
                <s-layout-section>
                    <s-card>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                            <div>
                                <s-heading level="2">Questions Asked</s-heading>
                                <s-paragraph tone="subdued">
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

                        {/* Questions List */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {questions.map((q) => (
                                <div
                                    key={q.id}
                                    style={{
                                        padding: "1rem",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "0.75rem",
                                        background: expandedQuestion === q.id ? "#f9fafb" : "white",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ flex: 1 }}>
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
                                                {q.product} • {formatDate(q.timestamp)}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                                            style={{
                                                padding: "0.5rem 1rem",
                                                borderRadius: "0.5rem",
                                                border: "1px solid #000000",
                                                background: expandedQuestion === q.id ? "#000000" : "white",
                                                color: expandedQuestion === q.id ? "white" : "#000000",
                                                fontSize: "0.75rem",
                                                fontWeight: 500,
                                                cursor: "pointer",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {expandedQuestion === q.id ? "Hide Answer" : "View Answer"}
                                        </button>
                                    </div>

                                    {/* Expanded Answer */}
                                    {expandedQuestion === q.id && (
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
                            Showing {questions.length} questions • Connect to Convex for live data
                        </div>
                    </s-card>
                </s-layout-section>
            </s-layout>
        </s-page>
    );
}
