import { action, internalAction, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const CHAT_MODEL = "gemini-2.5-flash-preview-09-2025";
const EMBEDDING_MODEL = "text-embedding-004"; // 768 dims

function getEnv(name: string): string | undefined {
  return (globalThis as any)?.process?.env?.[name];
}

async function embed(text: string, apiKey: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    content: { parts: [{ text }] },
    taskType: "RETRIEVAL_QUERY",
    outputDimensionality: 768,
  } as any;
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Embed failed: ${res.status}`);
  const data = await res.json();
  const values: number[] = data?.embedding?.values || [];
  if (!values?.length) throw new Error("Empty embedding");
  return values.map((x: any) => Number(x));
}

async function forceGeminiAnswer({ userQuery, topReviews, apiKey, research }: { userQuery: string; topReviews: any[]; apiKey: string; research: boolean }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const reviewsBlock = topReviews.map((r) => `- Author: ${r.author_name}\n  Rating: ${r.rating}/5\n  Fit: ${r.fit_feedback}\n  Review: ${r.review_body}`).join("\n\n");
  const baseSystem = `You are Kim, the Skims founder persona. Ground everything ONLY in the provided reviews. OUTPUT: at least 2 sentences (>60 chars). Never return empty. If not directly covered, say so briefly and redirect to the closest relevant fit/feel/use from reviews. Include your own consensus beyond any quote.`;
  const hint = research
    ? "BI MODE: 3–5 concise bullets with bold headings + one recommendation paragraph."
    : "STANDARD MODE: One short, conversational paragraph with your own consensus (optionally one short quote).";

  // Attempt 1
  let body: any = { systemInstruction: { parts: [{ text: baseSystem }] }, contents: [{ role: "user", parts: [{ text: `User question: "${userQuery}". ${hint}\n\nUse ONLY these customer reviews:\n\n${reviewsBlock}` }] }], generationConfig: { temperature: 0.5, topP: 0.9, maxOutputTokens: 512 } };
  let res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  let data: any = await res.json();
  let txt: string = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") || data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (txt && String(txt).trim()) return txt;

  // Attempt 2
  const stricter = baseSystem + "\nMUST: Minimum 80 characters. Do not output only headings or placeholders.";
  body = { systemInstruction: { parts: [{ text: stricter }] }, contents: [{ role: "user", parts: [{ text: `Rewrite clearly in persona. Question: "${userQuery}". ${hint}\n\nReviews:\n${reviewsBlock}` }] }], generationConfig: { temperature: 0.4, topP: 0.95, maxOutputTokens: 512 } };
  res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  data = await res.json();
  txt = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") || data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (txt && String(txt).trim()) return txt;

  // Attempt 3 (seed bullets)
  const seeds = topReviews.slice(0, 5).map((r: any) => {
    const full = String(r.review_body || "");
    const snippet = full.slice(0, 140) + (full.length > 140 ? "…" : "");
    return `• ${r.rating}/5 ${r.fit_feedback || ""} — ${snippet}`;
  }).join("\n");
  body = { systemInstruction: { parts: [{ text: stricter }] }, contents: [{ role: "user", parts: [{ text: `Using ONLY these review bullet seeds, write one helpful paragraph answering: "${userQuery}" in persona.\n\nSeeds:\n${seeds}` }] }], generationConfig: { temperature: 0.4, topP: 0.95, maxOutputTokens: 512 } };
  res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  data = await res.json();
  txt = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") || data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return txt || "";
}

async function generateKim({ userQuery, topReviews, apiKey, research }: { userQuery: string; topReviews: any[]; apiKey: string; research: boolean }) {
  const systemInstruction =
    "You are Kim, a helpful and chic style assistant for Skims. You are friendly, confident, and an expert on all the products. Your answers must be concise, helpful, and sound like you're giving advice to a friend. NEVER break character.\n\nCRITICAL RULE: If the user asks a question that is irrelevant or not in the review data (e.g., 'hair,' 'ankles,' 'shipping'), DO NOT say 'I don't know'... gracefully redirect to product value.";
  const reviewsBlock = topReviews
    .map((r) => `- Author: ${r.author_name}\n  Rating: ${r.rating}/5\n  Fit: ${r.fit_feedback}\n  Review: ${r.review_body}`)
    .join("\n\n");
  const researchHint = research
    ? "BI MODE: Provide 3–5 bullets with bold short headings summarizing themes, then an Evidence section with 2–3 bullets as Name (rating/5): \"≤18‑word quote\"; end with a recommendation paragraph."
    : "STANDARD MODE: Start with 1–2 sentence consensus in persona, then 'Evidence from reviews:' with 2–3 bullets attributing Name (rating/5) and a short quote.";
  const userPrompt = `Here is the user's question: "${userQuery}". ${researchHint} Answer only using the following customer reviews:\n\n${reviewsBlock}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = { systemInstruction: { parts: [{ text: systemInstruction }] }, contents: [{ role: "user", parts: [{ text: userPrompt }] }], generationConfig: { temperature: 0.6, topP: 0.9, maxOutputTokens: 768 } };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  const txt = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") || data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (txt && String(txt).trim()) return txt;
  // Force a Gemini-generated response if blank
  return await forceGeminiAnswer({ userQuery, topReviews, apiKey, research });
}

async function generateSuggestions({ userQuery, topReviews, apiKey }: { userQuery: string; topReviews: any[]; apiKey: string }) {
  const systemInstruction = "You generate 3 short, friendly follow-up questions for a shopping assistant chat. Keep each under 7 words, end with '?', avoid repetition.";
  const reviewsBlock = topReviews.map((r) => `- ${r.rating}/5 ${r.fit_feedback}: ${r.review_body}`).join("\n");
  const userPrompt = `Based on these reviews and the question '${userQuery}', output ONLY a JSON array of 3 follow-up questions.`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = { contents: [{ role: "user", parts: [{ text: systemInstruction + "\n\n" + reviewsBlock + "\n\n" + userPrompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 128 } };
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    const txt = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") || "[]";
    const arr = JSON.parse(txt);
    if (Array.isArray(arr)) return arr.slice(0, 3).map((s) => String(s));
  } catch {}
  return ["Is it breathable?", "True to size?", "Will it show lines?"];
}

export const get = query({
  args: { id: v.id("research_sessions") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const create = mutation({
  args: {},
  handler: async (ctx) => {
    const id = await ctx.db.insert("research_sessions", {
      status: "running",
      steps: ["Research started"],
      created_at: new Date().toISOString(),
    });
    console.log("[research.create]", { id });
    return id;
  },
});

export const appendStep = mutation({
  args: { id: v.id("research_sessions"), step: v.string() },
  handler: async (ctx, { id, step }) => {
    const doc = await ctx.db.get(id);
    const steps = [...(doc?.steps || []), step];
    await ctx.db.patch(id, { steps });
    console.log("[research.appendStep]", { id, step });
  },
});

export const finalize = mutation({
  args: { id: v.id("research_sessions"), answer: v.string(), sources: v.any(), suggestions: v.array(v.string()) },
  handler: async (ctx, { id, answer, sources, suggestions }) => {
    await ctx.db.patch(id, { status: "done", answer, sources, suggestions });
    console.log("[research.finalize]", { id, sourcesCount: Array.isArray(sources) ? sources.length : undefined, suggestions: suggestions?.length });
  },
});

export const markError = mutation({
  args: { id: v.id("research_sessions") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { status: "error" });
    console.log("[research.markError]", { id });
  },
});

export const run = internalAction({
  args: { id: v.id("research_sessions"), query: v.string(), product: v.optional(v.string()), history: v.array(v.object({ role: v.string(), text: v.string() })) },
  handler: async (ctx, { id, query, product, history }) => {
    const apiKey = getEnv("GEMINI_API_KEY");
    const addStep = async (m: string) => {
      await ctx.runMutation(api.research.appendStep, { id, step: m });
    };

    const t0 = Date.now();
    console.log("[research.run] start", { id, product, qLen: query.length, historyLen: history?.length });
    try {
      await addStep("Embedding query");
      const tEmbed = Date.now();
      const qEmbedding = await embed(query, apiKey!);
      console.log("[research.run] embedded", { dims: qEmbedding.length, ms: Date.now() - tEmbed });

      await addStep(`Searching reviews (product=${product || "any"})`);
      const tSearch = Date.now();
      const results = await (ctx as any).vectorSearch("skims_reviews", "byEmbedding", {
        vector: qEmbedding,
        limit: 24,
        filter: product ? (q: any) => q.eq("product", product) : undefined,
      });
      const ids = (results || []).map((r: any) => r._id);
      const topReviews = await (ctx.runQuery as any)("reviews:getManyByIds", { ids });
      console.log("[research.run] retrieved", { got: ids.length, ms: Date.now() - tSearch });

      await addStep(`Analyzing ${topReviews.length} reviews`);
      const tGen = Date.now();
      const answer = await generateKim({ userQuery: query, topReviews, apiKey: apiKey!, research: true });
      console.log("[research.run] generated answer", { chars: answer?.length || 0, ms: Date.now() - tGen });

      await addStep("Preparing suggestions");
      const tSug = Date.now();
      const suggestions = await generateSuggestions({ userQuery: query, topReviews, apiKey: apiKey! });
      console.log("[research.run] suggestions", { count: suggestions.length, ms: Date.now() - tSug });

      await ctx.runMutation(api.research.finalize, { id, answer, sources: topReviews, suggestions });
      await addStep("Done");
      console.log("[research.run] done", { id, totalMs: Date.now() - t0 });
    } catch (e) {
      await ctx.runMutation(api.research.markError, { id });
      await addStep("Error during research");
      console.log("[research.run] error", { id, error: String(e), totalMs: Date.now() - t0 });
    }
  },
});
