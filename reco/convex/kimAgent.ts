import { action } from "./_generated/server";
import { v } from "convex/values";
import { Agent, createTool } from "@convex-dev/agent";
import { components as generatedComponents } from "./_generated/api";

const CHAT_MODEL = "gemini-2.5-flash-preview-09-2025";
const EMBEDDING_MODEL = "text-embedding-004"; // 768

function getEnv(name: string): string | undefined {
  return (globalThis as any)?.process?.env?.[name];
}

// Tools
const embedTool = createTool({
  description: "Create a 768-d embedding for a text using Gemini",
  args: {} as any,
  handler: async (ctx: any, { text }: { text: string }) => {
    const apiKey = getEnv("GEMINI_API_KEY");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${encodeURIComponent(apiKey!)}`;
    const body = { content: { parts: [{ text }] }, taskType: "RETRIEVAL_QUERY", outputDimensionality: 768 } as any;
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    const values: number[] = data?.embedding?.values || [];
    return { vector: values };
  },
});

const retrieveTool = createTool({
  description: "Vector search top-K reviews optionally filtered by product",
  args: {} as any,
  handler: async (
    ctx: any,
    { vector, k, product }: { vector: number[]; k: number; product?: string }
  ) => {
    const results = await (ctx as any).vectorSearch("skims_reviews", "byEmbedding", {
      vector,
      limit: k,
      filter: product ? (q: any) => q.eq("product", product) : undefined,
    });
    const ids = (results || []).map((r: any) => r._id);
    const docs = await (ctx.runQuery as any)("reviews:getManyByIds", { ids });
    return { docs };
  },
});

const synthesizeTool = createTool({
  description: "Generate answer from reviews",
  args: {} as any,
  handler: async (
    ctx: any,
    { question, reviews, mode }: { question: string; reviews: any[]; mode?: string }
  ) => {
    const apiKey = getEnv("GEMINI_API_KEY");
    const systemInstruction = `
You are Reco, an AI shopping assistant. Your goal is to help shoppers make confident purchase decisions by answering their questions based on real customer reviews.

Core Mandate: Only use the provided customer reviews. Ground every claim in that data.

Tone & Style:
- Friendly, helpful, and knowledgeable
- Conversational but professional
- Supportive and encouraging

Interaction:
- Be direct and helpful
- Reference specific reviewers when quoting (e.g., "Sarah M. noted that...")
- Provide balanced perspectives when reviews differ

CRITICAL RULE #1 – Redirect: If the question isn't covered by reviews (shipping/returns/etc.), don't say you don't know; redirect confidently back to fit/feel/benefits.

CRITICAL RULE #2 – BI Hook: If the query is a business/analysis request (e.g., "show ripping reviews", "summarize complaints"), be direct and data-informed: provide a short insight summary (3–5 bullets with bold short headings) and one recommendation paragraph.

CRITICAL RULE #3 – Standard RAG Answer: For other questions, answer ONLY using the reviews. Write one helpful paragraph. You may include one short direct quote (≤20 words) if helpful, but you MUST add your own consensus in your own words; never output only quotes.
`;
    const reviewsBlock = reviews
      .map(
        (r: any) =>
          `- Author: ${r.author_name}\n  Rating: ${r.rating}/5\n  Fit: ${r.fit_feedback}\n  Review: ${r.review_body}`
      )
      .join("\n\n");

    const qLower = (question || "").toLowerCase();
    const wantsBI = /\bresearch\b|\banaly[sz]e\b|\binsight|\btrend|\btheme|\bsummary\b|\bwhat customers mention\b|\bacross reviews\b/.test(qLower);
    const useBI = mode === "research" || (mode === "auto" && wantsBI);

    const hint = useBI
      ? "BI MODE: Provide 3-5 bullets with bold short headings summarizing themes + one recommendation paragraph."
      : "STANDARD MODE: Provide one short, conversational paragraph in persona with your own consensus (optionally one short quote).";

    const userPrompt = `User question: \"${question}\". ${hint}\n\nGround your answer ONLY in these customer reviews:\n\n${reviewsBlock}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${encodeURIComponent(apiKey!)}`;
    const body = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.6, topP: 0.9, maxOutputTokens: 512 },
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const txt =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "";
    return { text: txt };
  },
});

const suggestTool = createTool({
  description: "Suggest 3 short follow-up questions",
  args: {} as any,
  handler: async (ctx: any, { question, reviews }: { question: string; reviews: any[] }) => {
    const apiKey = getEnv("GEMINI_API_KEY");
    const reviewsBlock = reviews
      .map((r: any) => `- ${r.rating}/5 ${r.fit_feedback}: ${r.review_body}`)
      .join("\n");
    const sys =
      "You generate 3 short, friendly follow-up questions for a shopping assistant chat. Keep each under 7 words, end with '?', avoid repetition.";
    const prompt = `${sys}\n\nQuestion: ${question}\nReviews:\n${reviewsBlock}\n\nReturn ONLY a JSON array of strings.`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${encodeURIComponent(apiKey!)}`;
    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 128 },
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const txt = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") || "[]";
    try {
      const arr = JSON.parse(txt);
      if (Array.isArray(arr)) return { suggestions: arr.slice(0, 3) };
    } catch { }
    return {
      suggestions: [
        "Is it breathable?",
        "True to size?",
        "Will it show lines?",
      ],
    };
  },
});

function buildEvidence(docs: any[], n = 3): string {
  const items = (docs || []).slice(0, n).map((r: any) => {
    const name = r.author_name || r.reviewer || "(Anonymous)";
    const rating = typeof r.rating === "number" ? r.rating : "";
    const full = String(r.review_body || "");
    const quote = full.replace(/\s+/g, " ").slice(0, 120).replace(/[\"\n]+/g, " ");
    return `- ${name}${rating !== "" ? ` (${rating}/5)` : ""}: "${quote}${full.length > 120 ? "…" : ""}"`;
  });
  return `Evidence from reviews:\n${items.join("\n")}`;
}

function sanitizeAnswer(t: string): string {
  if (!t) return t;
  let s = String(t);
  // Replace em/en dashes with simple punctuation
  s = s.replace(/[—–]/g, "-");
  // Remove quotes wrapped around a dash or punctuation
  s = s.replace(/"\s*([-,:;])\s*"/g, "$1");
  // Normalize spaces around hyphens
  s = s.replace(/\s*-\s*/g, " - ");
  // Collapse repeated spaces
  s = s.replace(/\s{2,}/g, " ");
  // Trim weird leading/trailing quotes
  s = s.replace(/^\s*"+|"+\s*$/g, "");
  return s.trim();
}

function isPolicyQuery(q: string): boolean {
  const s = (q || "").toLowerCase();
  return /\b(return|refund|exchange|shipping|delivery|policy|warranty|guarantee|store credit|restocking)\b/.test(s);
}

function buildSafeRedirect(q: string): string {
  // Brand-safe redirect answer, no policy claims.
  const lead = `I can't speak to store policies here, but I can help with how this piece actually feels and fits.`;
  const guide = `Most customers talk about compression that smooths without digging, seamless lines under outfits, and sizing that runs true—with some sizing up for longer torsos.`;
  const tip = `If you're between sizes, go by the size chart or size up for comfort. For smoothing under dresses, mid to high compression works best; for all-day wear, lighter compression is more comfortable.`;
  return `${lead} ${guide} ${tip}`;
}

function extractStructuredFilters(q: string): { keywords: string[]; maxRating?: number; minRating?: number } {
  const s = (q || "").toLowerCase();
  const keywords: string[] = [];
  // capture quoted phrases
  const quoted = Array.from(s.matchAll(/['"]([^'"]+)['"]/g)).map(m => m[1].trim()).filter(Boolean);
  keywords.push(...quoted);
  // capture common terms after mention
  if (/\bclasp(s)?\b/.test(s)) keywords.push("clasp");
  if (/\bbutton(s)?\b/.test(s)) keywords.push("button");
  if (/\bstrap(s)?\b/.test(s)) keywords.push("strap");
  if (/\badjustable\b/.test(s)) keywords.push("adjustable");
  // rating filters
  let maxRating: number | undefined;
  let minRating: number | undefined;
  // phrases like "3 stars or less", "<= 3", "under 3", "at most 3"
  const m1 = s.match(/(\d(\.\d)?)\s*stars?\s*(or\s*less|and\s*below|or\s*fewer)/);
  const m2 = s.match(/<=?\s*(\d(\.\d)?)/);
  const m3 = s.match(/(under|below|less\s*than)\s*(\d(\.\d)?)/);
  const m4 = s.match(/(at\s*most)\s*(\d(\.\d)?)/);
  if (m1) maxRating = Number(m1[1]);
  else if (m2) maxRating = Number(m2[1]);
  else if (m3) maxRating = Number(m3[2]) - 0.001; // strictly less than
  else if (m4) maxRating = Number(m4[2]);
  // phrases like ">= 4", "4 stars or more"
  const g1 = s.match(/>=?\s*(\d(\.\d)?)/);
  const g2 = s.match(/(\d(\.\d)?)\s*stars?\s*(or\s*more|and\s*above)/);
  if (g1) minRating = Number(g1[1]);
  else if (g2) minRating = Number(g2[1]);
  return { keywords: Array.from(new Set(keywords.filter(Boolean))), maxRating, minRating };
}

async function forceGeminiAnswer({
  question,
  reviews,
  apiKey,
  mode,
}: {
  question: string;
  reviews: any[];
  apiKey: string;
  mode?: string;
}): Promise<string> {
  const reviewsBlock = (reviews || [])
    .map(
      (r: any) =>
        `- Author: ${r.author_name}\n  Rating: ${r.rating}/5\n  Fit: ${r.fit_feedback}\n  Review: ${r.review_body}`
    )
    .join("\n\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const baseSystem = `
You are Reco, an AI shopping assistant. Ground everything ONLY in the provided reviews.
OUTPUT REQUIREMENTS: Respond in natural prose with at least 2 sentences (>60 characters). Never return an empty response. If the reviews don't cover the question directly, say that and redirect to the closest relevant fit/feel/use guidance from the reviews. Always include your own consensus beyond any quote.
STYLE GUARDRAILS: Avoid em/en dashes (—, –). Prefer commas or short sentences. No heavy punctuation patterns.
  `;

  const hint =
    mode === "research"
      ? "BI MODE: 3–5 concise bullets with bold short headings + one recommendation paragraph."
      : "STANDARD MODE: One short, conversational paragraph with your own consensus (you may include one short quote).";

  // Attempt 1 (strict system)
  let body: any = {
    systemInstruction: { parts: [{ text: baseSystem }] },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `User question: "${question}". ${hint}\n\nUse ONLY these customer reviews:\n\n${reviewsBlock}`,
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.5, topP: 0.9, maxOutputTokens: 768 },
  };
  let res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: any = await res.json();
  let txt: string =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") ||
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "";

  if (txt && String(txt).trim()) return txt;

  // Attempt 2 (even more explicit constraint)
  const stricterSystem = `${baseSystem}\nMUST: Minimum 80 characters. Do not output only headings or placeholders.`;
  body = {
    systemInstruction: { parts: [{ text: stricterSystem }] },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Rewrite clearly in persona. Question: "${question}". ${hint}\n\nReviews:\n${reviewsBlock}`,
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.5, topP: 0.95, maxOutputTokens: 2048 },
  };
  res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  data = await res.json();
  txt =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") ||
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "";

  if (txt && String(txt).trim()) return txt;

  // Attempt 3 (seed with compact bullets to nudge summary)
  const seeds = (reviews || [])
    .slice(0, 5)
    .map((r: any) => {
      const full = String(r.review_body || "");
      const snippet = full.slice(0, 140) + (full.length > 140 ? "…" : "");
      return `• ${r.rating}/5 ${r.fit_feedback || ""} — ${snippet}`;
    })
    .join("\n");
  body = {
    systemInstruction: { parts: [{ text: stricterSystem }] },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Using ONLY these review bullet seeds, write one helpful paragraph answering: "${question}" in persona.\n\nSeeds:\n${seeds}`,
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.45, topP: 0.95, maxOutputTokens: 2048 },
  };
  res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  data = await res.json();
  txt =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") ||
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "";
  return txt || "";
}

const component = (generatedComponents as any).agent;
const RecoAgent = new Agent(component, {
  name: "Reco",
  languageModel: { provider: "google", model: CHAT_MODEL } as any,
  instructions: "AI shopping assistant; helpful, knowledgeable, and warm. Ground answers only in reviews; redirect irrelevant topics; for BI requests, provide brief bullet insights + recommendation; otherwise one helpful paragraph with your own consensus (optionally one short quote).",
  tools: { embedTool, retrieveTool, synthesizeTool, suggestTool } as any,
});

export const startThread = action({
  args: { userId: v.optional(v.string()), title: v.optional(v.string()) },
  handler: async (ctx, { userId, title }) => {
    const t0 = Date.now();
    const { threadId } = await RecoAgent.createThread(ctx as any, {
      userId: userId ?? null,
      title: title ?? "Reco Chat",
    });
    console.log("[kimAgent.startThread] created", { threadId, ms: Date.now() - t0 });
    return { threadId };
  },
});

export const getOrCreateDemoThread = action({
  args: {},
  handler: async (ctx) => {
    const t0 = Date.now();
    // Fetch metadata to see if a demo thread already exists
    const meta = await (ctx.runQuery as any)("metadata:get", {});
    if (meta?.demoThreadId) {
      console.log("[kimAgent.demoThread] existing", { threadId: meta.demoThreadId });
      return { threadId: meta.demoThreadId };
    }
    const { threadId } = await RecoAgent.createThread(ctx as any, {
      userId: "demo",
      title: "Skims Demo Chat",
    });
    await (ctx.runMutation as any)("metadata:setDemoThreadId", { threadId });
    console.log("[kimAgent.demoThread] created", { threadId, ms: Date.now() - t0 });
    return { threadId };
  },
});

export const ask = action({
  args: {
    threadId: v.string(),
    question: v.string(),
    product: v.optional(v.string()),
    mode: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { threadId, question, product, mode }: { threadId: string; question: string; product?: string; mode?: string }
  ) => {
    const t0 = Date.now();
    console.log("[kimAgent.ask] start", { threadId, product, mode, qLen: question.length });

    // Always persist the user's message first so the UI shows it even on failure
    await RecoAgent.saveMessage(ctx as any, {
      message: { role: "user", content: [{ type: "text", text: question }] } as any,
      threadId,
      userId: undefined,
      skipEmbeddings: true,
    });

    try {
      // Hard redirect for policy/returns/shipping queries BEFORE any retrieval
      if (isPolicyQuery(question)) {
        const safe = sanitizeAnswer(buildSafeRedirect(question));
        await RecoAgent.saveMessage(ctx as any, {
          message: { role: "assistant", content: [{ type: "text", text: safe }] } as any,
          threadId,
          userId: undefined,
          skipEmbeddings: true,
        });
        console.log("[kimAgent.ask] policy-redirect");
        return {
          ok: true, answer: safe, sources: [], suggestions: [
            "Does it show under clothes?",
            "How's the compression level?",
            "Can I wear it all day?",
          ]
        };
      }

      // 1) Embed the question using Gemini
      const apiKey = getEnv("GEMINI_API_KEY");
      const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${encodeURIComponent(apiKey!)}`;
      const embedBody = { content: { parts: [{ text: question }] }, taskType: "RETRIEVAL_QUERY", outputDimensionality: 768 } as any;
      const tEmbed = Date.now();
      const embedRes = await fetch(embedUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(embedBody) });
      const embedData = await embedRes.json();
      const vector: number[] = embedData?.embedding?.values || [];
      console.log("[kimAgent.ask] embedded", { dims: vector.length, ms: Date.now() - tEmbed });

      // 2) Retrieve top reviews (dynamic K)
      const isBI = /\banaly[sz]e\b|\binsight|\btrend|\btheme|\bsummary\b|\bwhat customers mention\b|\bacross reviews\b/i.test(question);
      let k = isBI ? 48 : 24; // base
      if (question.length < 40) k = Math.max(16, Math.floor(k / 2));
      if (question.length > 140) k = Math.min(64, k + 16);
      const tSearch = Date.now();
      const results = await (ctx as any).vectorSearch("skims_reviews", "byEmbedding", {
        vector,
        limit: k,
        filter: product ? (q: any) => q.eq("product", product) : undefined,
      });
      const ids = (results || []).map((r: any) => r._id);
      let docs = await (ctx.runQuery as any)("reviews:getManyByIds", { ids });

      // 2b) Filter out non-bodysuit reviews (shirts/tees) and apply structured filters
      const isBodysuitReview = (r: any) => {
        const body = String(r.review_body || "").toLowerCase();
        // Exclude reviews clearly about shirts/tees/tops
        if (/(t-shirt|tshirt|shirt|\btee\b|\btop\b)/.test(body) && !/(bodysuit|onesie|one-piece)/.test(body)) {
          return false;
        }
        return true;
      };
      docs = (docs || []).filter(isBodysuitReview);

      const filters = extractStructuredFilters(question);
      const needKeyword = filters.keywords && filters.keywords.length > 0;
      const needRating = typeof filters.maxRating === 'number' || typeof filters.minRating === 'number';
      if (needKeyword || needRating) {
        const kw = (filters.keywords || []).map(s => s.toLowerCase());
        const within = (r: any) => {
          const body = String(r.review_body || "").toLowerCase();
          const rating = Number(r.rating || 0);
          const keywordOk = kw.length ? kw.some(k => body.includes(k)) : true;
          const maxOk = typeof filters.maxRating === 'number' ? rating <= (filters.maxRating as number) : true;
          const minOk = typeof filters.minRating === 'number' ? rating >= (filters.minRating as number) : true;
          return keywordOk && maxOk && minOk;
        };
        let filtered = (docs || []).filter(within);
        // If not enough matches from vector search, fall back to full scan (small dataset ~1.2k)
        if (filtered.length < 3) {
          try {
            const all = await (ctx.runQuery as any)("reviews:list", {});
            filtered = (all || []).filter((r: any) => isBodysuitReview(r) && within(r));
          } catch { }
        }
        if (filtered.length) {
          docs = filtered;
          console.log("[kimAgent.ask] structured-filter", { total: filtered.length, keywords: kw, maxRating: filters.maxRating, minRating: filters.minRating });
        }
      }
      console.log("[kimAgent.ask] retrieved", { requested: k, got: ids.length, ms: Date.now() - tSearch });

      // 3) Synthesize answer (BI-aware) via Gemini
      function cleanReviewText(body: any): string {
        const s = String(body || "");
        if (s.trim().startsWith("{")) {
          try { const j = JSON.parse(s); if (typeof j.body === "string") return j.body; } catch { }
          try { const fixed = s.replace(/'/g, '"').replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false'); const j2 = JSON.parse(fixed); if (typeof j2.body === "string") return j2.body; } catch { }
        }
        return s.replace(/\{\'attributes\':[\s\S]*?\}\s*/g, "").trim();
      }
      const reviewsBlock = docs.map((r: any) => `- Author: ${r.author_name}\n  Rating: ${r.rating}/5\n  Fit: ${r.fit_feedback}\n  Review: ${cleanReviewText(r.review_body)}`).join("\n\n");
      const biHint = /\banaly[sz]e\b|\binsight|\btrend|\btheme|\bsummary\b|\bwhat customers mention\b|\bacross reviews\b|\bshow me all reviews\b|\blist reviews\b/i.test(question)
        ? "BI MODE: If the user specified keywords or rating thresholds, ONLY include matching reviews. First list matches as bullet lines: Reviewer (rating/5): short quoted snippet. Then add a 1-paragraph insight. No separate Evidence section."
        : "STANDARD MODE: Write one natural paragraph in persona. Weave 2–3 short reviewer attributions inline like: Abby M. (4/5) \"…\". Avoid headings or bullet sections.";
      const systemInstruction = `
You are Reco, an AI shopping assistant. You're helpful, knowledgeable, and genuinely focused on helping customers. Ground every answer in the provided customer reviews.

PERSONALITY & TONE:
- Be conversational and friendly, but professional. Think knowledgeable shopping assistant.
- Use helpful warmth strategically:
  • Open naturally (e.g., "Great question," "Here's what customers say," "Looking at the reviews")
  • Show enthusiasm genuinely when the product has positive reviews
- Avoid overly casual terms like 'gorgeous', 'babe', 'honey', 'hun'.
- Vary your openings naturally based on the question:
  • Direct questions: Jump straight to the answer
  • Concerns/worries: Use reassuring warmth
  • Compliments/excitement: Match their energy appropriately

LANGUAGE GUIDELINES:
- Use natural, professional language
- Reference reviewers by name when quoting (e.g., "Sarah M. mentioned...")
- Say "customers" or "reviewers" naturally
- Be helpful without being overly familiar

CONTENT RULES:
- Business/analysis: 3–5 bullets with insights + recommendation
- Normal questions: ONE conversational paragraph with 2–3 reviewer quotes (name + rating)
- If reviews don't address it: Be honest, share closest relevant info
- Policy questions: Redirect warmly to fit/feel

STYLE: Conversational, warm, professional. No em-dashes. Natural sentence variety.
`;
      const userPrompt = `User question: "${question}". ${biHint}\n\nGround your answer ONLY in these customer reviews:\n\n${reviewsBlock}`;
      const chatUrl = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${encodeURIComponent(apiKey!)}`;
      const body = { systemInstruction: { parts: [{ text: systemInstruction }] }, contents: [{ role: "user", parts: [{ text: userPrompt }] }], generationConfig: { temperature: 0.55, topP: 0.9, maxOutputTokens: 2048 } };
      const tGen = Date.now();
      const res = await fetch(chatUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      const finish = data?.candidates?.[0]?.finishReason || data?.candidates?.[0]?.safetyRatings || null;
      let answer = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") || data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!answer || !String(answer).trim()) {
        answer = await forceGeminiAnswer({ question, reviews: docs, apiKey: apiKey!, mode });
      }
      // If we hit MAX_TOKENS, continue once to finish the thought
      if (finish === "MAX_TOKENS") {
        const continueBody = {
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [
            { role: "user", parts: [{ text: userPrompt }] },
            { role: "model", parts: [{ text: answer }] },
            { role: "user", parts: [{ text: "Continue and complete the previous answer in 1-2 sentences. Avoid repetition." }] },
          ],
          generationConfig: { temperature: 0.45, topP: 0.95, maxOutputTokens: 512 },
        } as any;
        const contRes = await fetch(chatUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(continueBody) });
        const contData = await contRes.json();
        const contTxt = contData?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") || "";
        answer = `${answer} ${contTxt}`;
        console.log("[kimAgent.ask] continued", { addChars: contTxt?.length || 0 });
      }
      answer = sanitizeAnswer(answer);
      console.log("[kimAgent.ask] generated", { chars: answer?.length || 0, finish, k, ms: Date.now() - tGen });

      // 4) Save assistant message
      await RecoAgent.saveMessage(ctx as any, {
        message: { role: "assistant", content: [{ type: "text", text: answer }] } as any,
        threadId,
        userId: undefined,
        skipEmbeddings: true,
      });

      // 5) Generate contextual suggestions based on current question and answer
      let suggestions: string[] = [];
      try {
        // Ultra-simple prompt to avoid token issues
        const q = String(question).slice(0, 80);
        const a = String(answer).slice(0, 120);
        const prompt = `Generate 3 short shopping questions about a bodysuit (5 words max each). User just asked: "${q}". Return JSON array: ["Q1?", "Q2?", "Q3?"]`;

        const sRes = await fetch(chatUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 512,
              candidateCount: 1
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
          })
        });

        if (sRes.ok) {
          const sData = await sRes.json();
          const candidate = sData?.candidates?.[0];
          console.log("[kimAgent.ask] suggestions response", {
            hasCandidate: !!candidate,
            hasParts: !!(candidate?.content?.parts),
            finishReason: candidate?.finishReason
          });

          const parts = candidate?.content?.parts;
          if (!parts || !Array.isArray(parts) || parts.length === 0) {
            console.log("[kimAgent.ask] suggestions no parts", { candidate });
            throw new Error("No parts in candidate response");
          }

          const txt = parts.map((p: any) => p.text).join("\n") || "";
          console.log("[kimAgent.ask] suggestions raw", { txt, len: txt.length });

          if (txt.trim()) {
            // Try to parse JSON array
            const cleaned = txt.replace(/```json\n?|```\n?/g, "").trim();
            const arr = JSON.parse(cleaned);
            if (Array.isArray(arr) && arr.length > 0) {
              suggestions = arr.slice(0, 3).map((s: any) => String(s).trim());
              console.log("[kimAgent.ask] suggestions success", { suggestions });
            }
          }
        } else {
          const errText = await sRes.text();
          console.log("[kimAgent.ask] suggestions API error", { status: sRes.status, error: errText.slice(0, 200) });
        }
      } catch (err) {
        console.log("[kimAgent.ask] suggestions failed", { error: String(err) });
      }

      // Fallback suggestions
      if (!suggestions.length) {
        suggestions = ["Does it show under clothes?", "How's the compression level?", "Can I wear it all day?"];
      }

      console.log("[kimAgent.ask] done", { ms: Date.now() - t0 });
      return { ok: true, answer, sources: docs, suggestions };
    } catch (e) {
      console.log("[kimAgent.ask] error", { error: String(e), ms: Date.now() - t0 });
      // Best-effort: still try to return a Gemini-generated answer using recent reviews
      try {
        const apiKey = getEnv("GEMINI_API_KEY");
        const recent = await (ctx.runQuery as any)("reviews:list", {});
        const seedDocs = Array.isArray(recent) ? recent.slice(0, 8) : [];
        const aiFallback = await forceGeminiAnswer({ question, reviews: seedDocs, apiKey: apiKey!, mode });
        const textRaw = aiFallback && String(aiFallback).trim()
          ? aiFallback
          : "Based on recent reviews, people talk about compression, smooth lines, and true to size with occasional sizing up for longer torsos.";
        const text = sanitizeAnswer(textRaw as string);
        await RecoAgent.saveMessage(ctx as any, {
          message: { role: "assistant", content: [{ type: "text", text: text }] } as any,
          threadId,
          userId: undefined,
          skipEmbeddings: true,
        });
        return { ok: false, answer: text, sources: seedDocs, suggestions: ["Does it show under clothes?", "How's the compression level?", "Can I wear it all day?"] };
      } catch (e2) {
        const fallback = "I can help you learn about this product based on customer reviews - ask me about fit, comfort, compression, or how it looks under clothes.";
        await RecoAgent.saveMessage(ctx as any, {
          message: { role: "assistant", content: [{ type: "text", text: fallback }] } as any,
          threadId,
          userId: undefined,
          skipEmbeddings: true,
        });
        return { ok: false, answer: fallback, sources: [], suggestions: ["Does it show under clothes?", "How's the compression level?", "Can I wear it all day?"] };
      }
    }
  },
});
