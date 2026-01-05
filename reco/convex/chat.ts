import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const CHAT_MODEL = "gemini-2.5-flash-preview-09-2025";
const EMBEDDING_MODEL = "text-embedding-004"; // 768 dims

function getEnv(name: string): string | undefined {
  return (globalThis as any)?.process?.env?.[name];
}

async function embed(text: string, apiKey: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${encodeURIComponent(
    apiKey
  )}`;
  const body = {
    content: { parts: [{ text }] },
    taskType: "RETRIEVAL_QUERY",
    outputDimensionality: 768,
  } as any;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Embed failed: ${res.status}`);
  const data = await res.json();
  const values: number[] = data?.embedding?.values || [];
  if (!values?.length) throw new Error("Empty embedding");
  return values.map((x: any) => Number(x));
}

async function generateKimAnswer({ userQuery, topReviews, apiKey, history, mode }: { userQuery: string; topReviews: any[]; apiKey: string; history: { role: string; text: string }[]; mode?: "default" | "research" }) {
  const systemInstruction =
    "You are a precise, honest product review assistant for this Shopify store. Your job is to help shoppers understand how a product feels, fits, and performs based ONLY on the information provided to you.\n\nSOURCE OF TRUTH RULE: The customer reviews (and any explicit product facts included in the prompt) are your only sources of truth. If the user asks about something that is not supported by those reviews or facts (for example shipping, returns, policies, or unrelated topics), you MUST say that you don't have enough information from the reviews to answer confidently, and you must NOT guess or invent details. When review coverage is thin, acknowledge that explicitly and then focus on a small number of clear, factual takeaways that ARE supported by the reviews. Keep answers concise, neutral, and free of marketing fluff.";

  const reviewsBlock = topReviews
    .map(
      (r) => `- Author: ${r.author_name}\n  Rating: ${r.rating}/5\n  Fit: ${r.fit_feedback}\n  Review: ${r.review_body}`
    )
    .join("\n\n");

  const researchHint = mode === "research"
    ? "Focus on synthesizing insights, recurring themes, and trade-offs. Provide 3-5 bullets with bold short headings, then one tight recommendation paragraph."
    : "Answer as a friendly assistant with one concise paragraph.";

  const userPrompt = `Here is the user's question: "${userQuery}". ${researchHint} Answer this question only using the information from the following customer reviews. Do not make anything up. Here are the reviews:\n\n${reviewsBlock}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const conversation = (history || []).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [...conversation, { role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: { temperature: 0.6, topP: 0.9, maxOutputTokens: 512 },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini chat failed: ${res.status} ${t}`);
  }
  const data = await res.json();
  const txt =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") ||
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "";
  return txt;
}

function fallbackFromReviews(userQuery: string, topReviews: any[]) {
  if (!topReviews?.length) return "I couldn't find enough in the reviews to answer that confidently.";
  const bullets = topReviews
    .map(
      (r: any, i: number) => `${i + 1}. ${r.rating}/5 • ${r.fit_feedback} — ${r.review_body.slice(0, 140)}${r.review_body.length > 140 ? "…" : ""
        }`
    )
    .join("\n");
  return `Here's what customers mention related to "${userQuery}":\n\n${bullets}`;
}

async function generateSuggestions({ userQuery, history, topReviews, apiKey }: { userQuery: string; history: { role: string; text: string }[]; topReviews: any[]; apiKey: string }): Promise<string[]> {
  const systemInstruction = "You generate 3 short, friendly follow-up questions for a shopping assistant chat. Keep each under 7 words, no punctuation except '?', and avoid repetition.";
  const convo = (history || []).slice(-6).map((m) => `${m.role}: ${m.text}`).join("\n");
  const reviewsBlock = topReviews.map((r) => `- ${r.rating}/5 ${r.fit_feedback}: ${r.review_body}`).join("\n");
  const userPrompt = `Based on the conversation and these review snippets, propose 3 follow-up questions the user is likely to ask next. Return ONLY a JSON array of strings.\n\nConversation:\n${convo}\n\nUser question: ${userQuery}\n\nReviews:\n${reviewsBlock}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = { contents: [{ role: "user", parts: [{ text: systemInstruction + "\n\n" + userPrompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 128 } };
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const txt = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") || "[]";
    try {
      const arr = JSON.parse(txt);
      if (Array.isArray(arr)) return arr.slice(0, 3).map((s) => String(s));
    } catch { }
    // naive fallback by lines
    return txt.split(/\n|\,/).map((s: string) => s.replace(/^[\-\s\"]+|[\"\s]+$/g, "")).filter(Boolean).slice(0, 3);
  } catch {
    return [
      "Is it breathable?",
      "True to size?",
      "Will it show lines?",
    ];
  }
}

/**
 * Main chat action - handles user queries and saves to database
 * 
 * This is the primary entry point for the widget chat.
 * It:
 * 1. Gets or creates a conversation
 * 2. Saves the user message
 * 3. Generates AI response from reviews
 * 4. Saves the assistant message
 * 5. Returns the response with suggestions
 */
export const ask = action({
  args: {
    query: v.string(),
    topK: v.optional(v.number()),
    history: v.optional(v.array(v.object({ role: v.string(), text: v.string() }))),
    product: v.optional(v.string()),
    research: v.optional(v.boolean()),
    // New: session tracking for message storage
    session_id: v.optional(v.string()),
    shopify_domain: v.optional(v.string()),
    product_title: v.optional(v.string()),
  },
  handler: async (ctx, { query, topK, history, product, research, session_id, shopify_domain, product_title }) => {
    const apiKey = getEnv("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY not set in Convex env");

    // 1) Get or create conversation if session tracking is enabled
    let conversationId: any = null;
    if (session_id && shopify_domain) {
      try {
        const result = await ctx.runMutation(api.conversations.getOrCreateConversation, {
          session_id,
          shopify_domain,
          product_id: product,
          product_title,
        });
        conversationId = result.conversation_id;

        // Save user message
        await ctx.runMutation(api.conversations.saveMessage, {
          conversation_id: conversationId,
          role: "user",
          content: query,
        });
      } catch (e) {
        console.error("[chat.ask] Failed to save user message:", e);
      }
    }

    // 2) Embed user query
    const qEmbedding = await embed(query, apiKey);

    // 3) Vector search topK reviews
    const k = topK ?? (research ? 24 : 8);
    const results = await (ctx as any).vectorSearch("skims_reviews", "byEmbedding", {
      vector: qEmbedding,
      limit: k,
      filter: product ? (q: any) => q.eq("product", product) : undefined,
    });
    const ids = (results || []).map((r: any) => r._id);
    const topReviews = await (ctx.runQuery as any)("reviews:getManyByIds", { ids });

    // Merge scores
    const scoreById = new Map((results || []).map((r: any) => [String(r._id), r._score]));
    const sources = topReviews.map((doc: any) => ({ _id: doc._id, _score: scoreById.get(String(doc._id)) ?? null, doc }));

    // 4) Generate answer from top reviews
    let answer = await generateKimAnswer({ userQuery: query, topReviews, apiKey, history: history || [], mode: research ? "research" : "default" });
    if (!answer?.trim()) answer = fallbackFromReviews(query, topReviews);

    // 5) Generate next-step suggestions
    const suggestions = await generateSuggestions({ userQuery: query, history: history || [], topReviews, apiKey });

    // 6) Save assistant message if tracking is enabled
    if (conversationId) {
      try {
        await ctx.runMutation(api.conversations.saveMessage, {
          conversation_id: conversationId,
          role: "assistant",
          content: answer,
          sources_count: sources.length,
          suggestions,
        });
      } catch (e) {
        console.error("[chat.ask] Failed to save assistant message:", e);
      }
    }

    return { answer, sources, suggestions };
  },
});
