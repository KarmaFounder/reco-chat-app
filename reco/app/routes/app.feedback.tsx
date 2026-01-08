/**
 * Feedback Page - Shows likes/dislikes percentage for messages
 */

export default function Feedback() {
    // Demo data - would come from Convex in production
    const feedbackData = {
        totalMessages: 1247,
        liked: 1089,
        disliked: 158,
        likePercentage: 87.3,
        dislikePercentage: 12.7,
    };

    return (
        <s-page title="Feedback Analytics">
            <s-layout>
                <s-layout-section>
                    <s-card>
                        <s-heading level="2">Message Feedback</s-heading>
                        <s-paragraph tone="subdued" style={{ marginBottom: "1.5rem" }}>
                            See how customers are responding to AI answers
                        </s-paragraph>

                        {/* Stats Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
                            <div style={{
                                padding: "1.5rem",
                                background: "#f9fafb",
                                borderRadius: "0.75rem",
                                textAlign: "center",
                            }}>
                                <div style={{ fontSize: "2rem", fontWeight: 700, color: "#111827" }}>
                                    {feedbackData.totalMessages.toLocaleString()}
                                </div>
                                <div style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
                                    Total Messages
                                </div>
                            </div>

                            <div style={{
                                padding: "1.5rem",
                                background: "#f0fdf4",
                                borderRadius: "0.75rem",
                                textAlign: "center",
                                border: "1px solid #bbf7d0",
                            }}>
                                <div style={{ fontSize: "2rem", fontWeight: 700, color: "#166534" }}>
                                    {feedbackData.likePercentage}%
                                </div>
                                <div style={{ fontSize: "0.875rem", color: "#166534", marginTop: "0.25rem" }}>
                                    👍 Liked
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                                    {feedbackData.liked.toLocaleString()} messages
                                </div>
                            </div>

                            <div style={{
                                padding: "1.5rem",
                                background: "#fef2f2",
                                borderRadius: "0.75rem",
                                textAlign: "center",
                                border: "1px solid #fecaca",
                            }}>
                                <div style={{ fontSize: "2rem", fontWeight: 700, color: "#dc2626" }}>
                                    {feedbackData.dislikePercentage}%
                                </div>
                                <div style={{ fontSize: "0.875rem", color: "#dc2626", marginTop: "0.25rem" }}>
                                    👎 Disliked
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                                    {feedbackData.disliked.toLocaleString()} messages
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginTop: "1rem" }}>
                            <div style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                                Satisfaction Rate
                            </div>
                            <div style={{
                                height: "24px",
                                borderRadius: "12px",
                                overflow: "hidden",
                                display: "flex",
                                background: "#f3f4f6",
                            }}>
                                <div style={{
                                    width: `${feedbackData.likePercentage}%`,
                                    background: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                }}>
                                    {feedbackData.likePercentage}%
                                </div>
                                <div style={{
                                    width: `${feedbackData.dislikePercentage}%`,
                                    background: "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                }}>
                                    {feedbackData.dislikePercentage}%
                                </div>
                            </div>
                        </div>
                    </s-card>

                    <s-card style={{ marginTop: "1rem" }}>
                        <s-heading level="3">Recent Feedback</s-heading>
                        <s-paragraph tone="subdued">
                            Coming soon: View individual message feedback with customer context.
                        </s-paragraph>
                    </s-card>
                </s-layout-section>
            </s-layout>
        </s-page>
    );
}
