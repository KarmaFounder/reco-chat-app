import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const EMBEDDING_MODEL = "text-embedding-004"; // 768 dims

function getEnv(name: string): string | undefined {
  return (globalThis as any)?.process?.env?.[name];
}

function normalizeText(s: string | undefined | null): string {
  const t = String(s || "").toLowerCase();
  return t.replace(/\s+/g, " ").replace(/[^\w\s]/g, "").trim();
}

function tryParseLooseJson(maybe: any): any | null {
  if (typeof maybe !== "string") return null;
  const s = maybe.trim();
  if (!s.startsWith("{") || !s.endsWith("}")) return null;
  try {
    return JSON.parse(s);
  } catch {
    try {
      // Convert single quotes to double quotes and Python booleans to JSON
      const fixed = s
        .replace(/'/g, '"')
        .replace(/\bTrue\b/g, "true")
        .replace(/\bFalse\b/g, "false");
      return JSON.parse(fixed);
    } catch {
      return null;
    }
  }
}

async function embedText(text: string): Promise<number[]> {
  const apiKey = getEnv("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not set in Convex env");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${encodeURIComponent(
    apiKey
  )}`;
  const body = {
    // New Gemini embeddings payload shape
    content: { parts: [{ text }] },
    taskType: "RETRIEVAL_DOCUMENT",
    outputDimensionality: 768,
  } as any;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini embed failed: ${res.status} ${t}`);
  }
  const data = await res.json();
  const values: number[] =
    data?.embedding?.values || data?.data?.[0]?.embedding || [];
  if (!values?.length) throw new Error("Empty embedding");
  return values.map((x: any) => Number(x));
}

export const upsert = mutation({
  args: {
    review: v.object({
      id: v.optional(v.string()),
      external_id: v.optional(v.string()),
      product: v.optional(v.string()),
      author_name: v.string(),
      rating: v.number(),
      fit_feedback: v.string(),
      review_body: v.string(),
      created_at: v.string(),
      embedding: v.array(v.float64()),
    }),
  },
  handler: async (ctx, { review }) => {
    // Simple insert; if you need dedupe, add an index on external_id and query first
    const docId = await ctx.db.insert("skims_reviews", {
      external_id: review.external_id,
      product: review.product,
      author_name: review.author_name,
      rating: review.rating,
      fit_feedback: review.fit_feedback,
      review_body: review.review_body,
      created_at: review.created_at,
      embedding: review.embedding as any,
    });
    return docId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("skims_reviews")
      .withIndex("byCreatedAt")
      .order("desc")
      .collect();
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("skims_reviews").withIndex("byCreatedAt").collect();
    return docs.length;
  },
});

export const patchFields = mutation({
  args: { id: v.id("skims_reviews"), updates: v.any() },
  handler: async (ctx, { id, updates }) => {
    await ctx.db.patch(id, updates as any);
  },
});

export const deleteById = mutation({
  args: { id: v.id("skims_reviews") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const listProducts = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("skims_reviews").withIndex("byCreatedAt").take(1000);
    const set = new Set<string>();
    for (const d of docs) if (d.product) set.add(d.product);
    return Array.from(set);
  },
});

export const getManyByIds = query({
  args: { ids: v.array(v.id("skims_reviews")) },
  handler: async (ctx, { ids }) => {
    const docs = await Promise.all(ids.map((id) => ctx.db.get(id)));
    return docs.filter((d): d is NonNullable<typeof d> => !!d);
  },
});

export const bulkUpsertEmbedded = action({
  args: {
    reviews: v.array(
      v.object({
        id: v.optional(v.string()),
        external_id: v.optional(v.string()),
        product: v.optional(v.string()),
        author_name: v.string(),
        rating: v.number(),
        fit_feedback: v.string(),
        review_body: v.string(),
        created_at: v.string(),
      })
    ),
  },
  handler: async (ctx, { reviews }) => {
    // Embed + insert sequentially (or small batches) to stay within rate limits
    for (const r of reviews) {
      const body = String(r.review_body || "");
      const parsed = tryParseLooseJson(body);
      const coherent = parsed
        ? {
            author_name:
              (parsed.authorProfile && (parsed.authorProfile.displayName || parsed.authorProfile.author)) ||
              parsed.displayName ||
              parsed.author ||
              r.author_name,
            rating: Number(parsed.rating ?? r.rating ?? 0),
            fit_feedback: String(parsed.fitFeedback ?? r.fit_feedback ?? ""),
            review_body: String(parsed.body ?? parsed.review_body ?? body),
            created_at: String(parsed.dateCreated ?? parsed.createdAt ?? r.created_at ?? new Date().toISOString()),
          }
        : undefined;

      const finalRow = { ...r, ...(coherent || {}) } as any;
      const embedding = await embedText(finalRow.review_body);
      await ctx.runMutation(api.reviews.upsert, {
        review: { ...finalRow, embedding },
      });
    }
    // Mark metadata via mutation
    await ctx.runMutation(api.metadata.setSeeded, { isSeeded: true });
    return { inserted: reviews.length };
  },
});

export const normalizeAndDedupe = action({
  args: {},
  handler: async (ctx) => {
    const docs = await (ctx.runQuery as any)("reviews:list", {});
    const keep = new Map<string, string>();
    const toDelete: string[] = [];
    let patched = 0;

    for (const d of docs as any[]) {
      const updates: any = {};
      if (typeof d.review_body === "string" && d.review_body.trim().startsWith("{")) {
        const parsed = tryParseLooseJson(d.review_body);
        if (parsed) {
          updates.author_name = (parsed.authorProfile && (parsed.authorProfile.displayName || parsed.authorProfile.author)) || parsed.displayName || parsed.author || d.author_name;
          if (parsed.rating != null) updates.rating = Number(parsed.rating);
          if (parsed.fitFeedback != null) updates.fit_feedback = String(parsed.fitFeedback);
          if (parsed.body) updates.review_body = String(parsed.body);
          if (parsed.dateCreated || parsed.createdAt) updates.created_at = String(parsed.dateCreated || parsed.createdAt);
        }
      }

      const bodyForSig = updates.review_body ?? d.review_body;
      const key = d.external_id ? `ext:${String(d.external_id)}` : `sig:${normalizeText(bodyForSig)}:${String(d.product || "")}`;
      if (!keep.has(key)) keep.set(key, d._id);
      else toDelete.push(d._id);

      if (Object.keys(updates).length) {
        await (ctx.runMutation as any)("reviews:patchFields", { id: d._id, updates });
        patched++;
      }
    }

    for (const id of toDelete) await (ctx.runMutation as any)("reviews:deleteById", { id });
    return { total: (docs as any[]).length, patched, deleted: toDelete.length };
  },
});
