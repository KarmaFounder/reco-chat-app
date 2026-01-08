import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Papa from "papaparse";
import { convex } from "./lib/convexClient.js";
import aiLogo from "./assets/reco-ai-sparkle.png";

// Demo flag: disable uploads in the UI
const UPLOADS_DISABLED = true;

const PRODUCT_NAME = "Seamless Sculpt Brief Bodysuit"; // default fallback when no product name is passed in

function Stars({ rating = 0 }) {
  const r = Math.max(0, Math.min(5, Number(rating || 0)));
  return (
    <div className="flex items-center gap-1 text-yellow-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={`h-4 w-4 ${i < r ? "fill-yellow-400" : "fill-gray-200"} `}>
          <path d="M12 .587l3.668 7.435 8.2 1.192-5.934 5.786 1.402 8.17L12 18.896l-7.336 3.874 1.402-8.17L.132 9.214l8.2-1.192z" />
        </svg>
      ))}
    </div>
  );
}

// Extract displayName from Python dict string or return clean name
function cleanAuthorName(name) {
  if (!name || typeof name !== 'string') return "(Anonymous)";
  const t = name.trim();
  // If it's a Python dict string like "{'displayName': 'Name', ...}"
  if (t.startsWith("{") && t.includes("displayName")) {
    try {
      // Convert Python dict to JSON
      const fixed = t
        .replace(/'/g, '"')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null');
      const parsed = JSON.parse(fixed);
      return parsed.displayName || parsed.author || "(Anonymous)";
    } catch {
      // If parsing fails, try regex extraction
      const match = t.match(/'displayName'\s*:\s*'([^']+)'/);
      if (match) return match[1];
    }
  }
  return t || "(Anonymous)";
}

function cleanReviewBody(body) {
  if (!body) return "";
  let s = String(body);
  let t = s.trim();
  // Try to parse JSON-ish and use .body first
  if (t.startsWith("{")) {
    try { const parsed = JSON.parse(t); if (typeof parsed.body === 'string') return parsed.body; } catch { }
    try { const fixed = t.replace(/'/g, '"').replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false'); const parsed2 = JSON.parse(fixed); if (typeof parsed2.body === 'string') return parsed2.body; } catch { }
  }
  // Strip any leading object up to its closing brace, then take remaining text
  if (t.startsWith("{")) {
    let depth = 0;
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          const rest = t.slice(i + 1).trim();
          if (rest) return rest;
          break;
        }
      }
    }
  }
  // Aggressively remove all attribute/location/customAvatar/avatarUrl objects from text
  s = s.replace(/\{[^}]*?'?attributes'?[^}]*?\}/g, "");
  s = s.replace(/\{[^}]*?'?location'?[^}]*?\}/g, "");
  s = s.replace(/\{[^}]*?'?customAvatar'?[^}]*?\}/g, "");
  s = s.replace(/\{[^}]*?'?avatarUrl'?[^}]*?\}/g, "");
  s = s.replace(/\{[^}]*?'?displayName'?[^}]*?\}/g, "");
  // Collapse multiple spaces and trim
  return s.replace(/\s{2,}/g, " ").trim();
}

// Sliding Suggestions Component
// Sliding Suggestions Component
function SlidingSuggestions({ words, isLarge = false, isFocused = false }) {
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Wait longer between cycles, keep animation luxurious
    const interval = setInterval(() => {
      setIsAnimating(true);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // Handle reset after transition completes
  const handleTransitionEnd = () => {
    if (isAnimating) {
      setIsAnimating(false);
      setIndex((prev) => (prev + 1) % words.length);
    }
  };

  // Fixed container height logic
  const heightPx = isLarge ? 28 : 20;
  const containerHeightClass = isLarge ? "h-[28px]" : "h-[20px]";
  const textClass = isLarge ? "text-lg leading-7" : "text-sm leading-5";

  // NATIVE-LIKE CURSOR: absolute, 1px width, 1.2em height (balanced)
  const cursorClass = "reco-cursor-blink absolute left-0 top-1/2 -translate-y-1/2 w-[1px] h-[1.2em] bg-gray-900";

  return (
    <div className={`${containerHeightClass} overflow-hidden relative w-full`}>
      {!isFocused && <span className={cursorClass}></span>}
      <div
        onTransitionEnd={handleTransitionEnd}
        className={`flex flex-col gap-0 items-start w-full will-change-transform ${isAnimating ? "transition-transform duration-1000 ease-in-out" : ""}`}
        style={{
          transform: isAnimating ? `translateY(-${heightPx}px)` : "translateY(0px)",
        }}
      >
        <span className={`text-gray-500 ${textClass} ${containerHeightClass} flex items-center my-0 py-0 whitespace-nowrap overflow-hidden text-ellipsis w-full relative pl-0`}>
          {words[index]}
        </span>
        <span className={`text-gray-500 ${textClass} ${containerHeightClass} flex items-center my-0 py-0 whitespace-nowrap overflow-hidden text-ellipsis w-full relative pl-0`}>
          {words[(index + 1) % words.length]}
        </span>
      </div>
    </div>
  );
}

function ReviewCard({ r }) {
  if (!r) return null;
  const text = cleanReviewBody(r.review_body);
  const author = cleanAuthorName(r.author_name);
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-0">
        <div className="text-sm font-bold text-gray-900">{author}</div>
        <Stars rating={r.rating} />
      </div>
      <p className="mt-3 text-sm leading-6 text-gray-700 whitespace-pre-wrap break-words">{text}</p>
    </div>
  );
}

function ReviewCardSkeleton() {
  return (
    <div className="rounded-2xl bg-gray-50 p-4 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-0">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 w-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-gray-200 rounded"></div>
        <div className="h-3 w-5/6 bg-gray-200 rounded"></div>
        <div className="h-3 w-4/6 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

function ChatBubble({ role, text, className = "" }) {
  const isUser = role === "user";
  const [feedback, setFeedback] = useState(null); // 'up', 'down', or null

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} ${isUser ? "my-4" : "mt-4 mb-7"} px-1 ${className}`}>
      <div className="relative max-w-[85%] lg:max-w-lg">
        <div
          className={`rounded-2xl px-3 py-2 text-sm leading-6 shadow-sm ${isUser
            ? "bg-[#2D2D2D] text-white"
            : "bg-white text-gray-800 border border-gray-100"
            }`}
        >
          {text}
        </div>

        {!isUser && (
          <div className="absolute -bottom-3 right-2 flex gap-3 bg-white border border-gray-100 shadow-sm rounded-full px-2 py-1 z-10">
            <button
              onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
              className={`hover:scale-110 transition-transform ${feedback === 'up' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 10v12" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
              </svg>
            </button>
            <button
              onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
              className={`hover:scale-110 transition-transform ${feedback === 'down' ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14V2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 text-zinc-400">
      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.2s]" />
      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
    </div>
  );
}

export default function App({
  embedMode = false,
  initialWidgetMode = false,
  productName = PRODUCT_NAME,
  productImageUrl: propProductImageUrl,
  disableProductFilter = false,
  productId,
  productHandle,
  productPrice,
  productType,
  inputHeader,
  showHeader = true,
  shopDomain,
}) {
  console.log("App Component Rendering", { embedMode, initialWidgetMode, showHeader, inputHeader });

  // Transition Logic Removed: Reverting to instant mount per user request
  // const [shouldRender, setShouldRender] = useState(false);
  // const [isVisible, setIsVisible] = useState(false);
  const [widgetMode, setWidgetMode] = useState(embedMode ? false : initialWidgetMode);

  // Mobile detection for fullscreen mode (CSS media queries don't work reliably in widget context)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', checkMobile);
    checkMobile(); // Check on mount
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // useEffect(() => {
  //   if (widgetMode) {
  //     setShouldRender(true);
  //     requestAnimationFrame(() => {
  //       requestAnimationFrame(() => {
  //         setIsVisible(true);
  //       });
  //     });
  //   } else {
  //     setIsVisible(false);
  //     const timer = setTimeout(() => setShouldRender(false), 300);
  //     return () => clearTimeout(timer);
  //   }
  // }, [widgetMode]);

  const [chatHistory, setChatHistory] = useState([
    {
      role: "ai",
      text: `Ask me anything about the ${productName} – fit, comfort, what to wear it under, you name it.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [normalizing, setNormalizing] = useState(false);
  const [suggestions, setSuggestions] = useState([
    "What do tall buyers say about the fit?",
    "Does the fabric pill?",
    "Is it good for daily wear?",
  ]);
  const [threadId, setThreadId] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [uiMessages, setUIMessages] = useState([]);
  const [cachedMessages, setCachedMessages] = useState([]);
  const [optimistic, setOptimistic] = useState([]);
  const [productImageUrl, setProductImageUrl] = useState(
    propProductImageUrl || "/BD-BRF-3370-ONX-HD-SKIMS-SHAPEWEAR_0012-FR.png"
  );
  const [shopLogoUrl, setShopLogoUrl] = useState("");
  // const [widgetMode, setWidgetMode] = useState(initialWidgetMode); // Removed duplicate
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open for debugging
  const [isInputFocused, setIsInputFocused] = useState(false);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (widgetMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [widgetMode]);

  // Debug log when sources change
  useEffect(() => {
    console.log('📦 Sources updated:', sources.length, 'reviews');
  }, [sources]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [uiMessages, chatHistory, optimistic, isLoading]);

  // Update product image when prop changes (Shopify product image from embed)
  useEffect(() => {
    if (propProductImageUrl) {
      setProductImageUrl(propProductImageUrl);
    }
  }, [propProductImageUrl]);

  // Load shop logo URL from data attribute
  useEffect(() => {
    const root = document.getElementById("reco-chat-root");
    if (root) {
      let logoUrl = root.dataset.shopLogoUrl;
      console.log("🖼️ Shop logo URL from data attribute:", logoUrl);
      // Ensure https: protocol (handle protocol-relative URLs and malformed https: URLs)
      if (logoUrl && logoUrl.trim() !== "") {
        // Handle protocol-relative URLs (//cdn.shopify.com/...)
        if (logoUrl.startsWith("//")) {
          logoUrl = "https:" + logoUrl;
        }
        // Handle malformed https: URLs (https:cdn.shopify.com instead of https://cdn.shopify.com)
        else if (logoUrl.startsWith("https:") && !logoUrl.startsWith("https://")) {
          logoUrl = logoUrl.replace("https:", "https://");
        }
        // Handle malformed http: URLs
        else if (logoUrl.startsWith("http:") && !logoUrl.startsWith("http://")) {
          logoUrl = logoUrl.replace("http:", "http://");
        }
        setShopLogoUrl(logoUrl);
      }
    }
  }, []);

  // Load product image URL from data attribute
  useEffect(() => {
    const root = document.getElementById("reco-chat-root");
    if (root) {
      let imageUrl = root.dataset.productImageUrl;
      console.log("📸 Product image URL from data attribute:", imageUrl);
      // Ensure https: protocol (handle protocol-relative URLs and malformed https: URLs)
      if (imageUrl && imageUrl.trim() !== "") {
        // Handle protocol-relative URLs (//cdn.shopify.com/...)
        if (imageUrl.startsWith("//")) {
          imageUrl = "https:" + imageUrl;
        }
        // Handle malformed https: URLs (https:cdn.shopify.com instead of https://cdn.shopify.com)
        else if (imageUrl.startsWith("https:") && !imageUrl.startsWith("https://")) {
          imageUrl = imageUrl.replace("https:", "https://");
        }
        // Handle malformed http: URLs
        else if (imageUrl.startsWith("http:") && !imageUrl.startsWith("http://")) {
          imageUrl = imageUrl.replace("http:", "http://");
        }
        setProductImageUrl(imageUrl);
      }
    }
  }, []);

  // Initialize per-session thread on mount (persisted server-side, per device)
  useEffect(() => {
    if (threadId) return;
    (async () => {
      try {
        const cached = localStorage.getItem("kim_thread_id") || localStorage.getItem("kim_demo_thread_id");
        if (cached) {
          setThreadId(cached);
          return;
        }
        const res = await convex.action("kimAgent:startThread", {});
        if (res?.threadId) {
          localStorage.setItem("kim_thread_id", res.threadId);
          setThreadId(res.threadId);
        }
      } catch (e) {
        console.error("Failed to init thread", e);
      }
    })();
  }, [threadId]);


  // Local cache helpers (device-only persistence)
  function loadLocalMsgs(tid) {
    try {
      let raw = localStorage.getItem(`kim_msgs_${tid} `);
      if (!raw) raw = localStorage.getItem(`kim_demo_msgs_${tid} `); // legacy key
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  function saveLocalMsgs(tid, msgs) {
    try {
      localStorage.setItem(`kim_msgs_${tid} `, JSON.stringify(msgs));
    } catch { }
  }
  function appendLocalMsg(tid, role, text) {
    const current = loadLocalMsgs(tid);
    const next = [...current, { role, text }];
    saveLocalMsgs(tid, next);
    setCachedMessages(next);
  }

  // Load cached messages for this thread on mount/when thread changes
  useEffect(() => {
    if (!threadId) return;
    const arr = loadLocalMsgs(threadId);
    if (arr.length) setCachedMessages(arr);
  }, [threadId]);

  // Poll UI messages for the current thread
  useEffect(() => {
    if (!threadId) return;
    let cancelled = false;
    let timer;
    const poll = async () => {
      try {
        const res = await convex.query("agent_ui:listUIMessagesForThread", {
          threadId,
          paginationOpts: { numItems: 200 },
        });
        const items = res?.page?.items || res?.items || res?.messages || [];
        if (!cancelled && Array.isArray(items) && items.length) setUIMessages(items);
      } catch (e) {
        console.error("listUIMessagesForThread failed", e);
      } finally {
        if (!cancelled) timer = setTimeout(poll, 600);
      }
    };
    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [threadId]);

  function uiMessageText(m) {
    if (!m) return "";
    if (typeof m.text === "string") return m.text;
    const collect = [];
    const parts = Array.isArray(m.content)
      ? m.content
      : Array.isArray(m.parts)
        ? m.parts
        : Array.isArray(m.message?.content)
          ? m.message.content
          : [];
    for (const p of parts) {
      if (!p) continue;
      if (typeof p.text === "string") collect.push(p.text);
      else if (p.type === "text" && typeof p.text === "string") collect.push(p.text);
      else if (Array.isArray(p.content)) {
        for (const c of p.content) if (c && typeof c.text === "string") collect.push(c.text);
      }
    }
    return collect.join(" ");
  }

  const renderedMessages = useMemo(() => {
    let base;
    if (uiMessages && uiMessages.length) {
      base = uiMessages.map((m, i) => ({ key: m.id || `ui-${i}`, role: m.role === "user" ? "user" : "ai", text: uiMessageText(m) }));
    } else if (cachedMessages && cachedMessages.length) {
      base = cachedMessages.map((m, i) => ({ key: `cached-${i}`, role: m.role, text: m.text }));
    } else {
      base = chatHistory.map((m, i) => ({ key: `ch-${i}`, role: m.role, text: m.text }));
    }
    const optimisticMsgs = optimistic.map((m, i) => ({ key: m.key || `op-${i}`, role: m.role, text: m.text }));

    // Inject Welcome Message if there is any conversation history or active interaction
    const welcomeText = `Hey! Ask me anything about the ${productName} - fit, comfort, what to wear it under, you name it.`;
    const hasAnyMessages = (base && base.length > 0) || (optimisticMsgs && optimisticMsgs.length > 0);

    if (hasAnyMessages) {
      // Ensure we don't duplicate if it's somehow already there (though we don't persist it to server)
      if (!base) base = [];
      if (base.length === 0 || base[0].text !== welcomeText) {
        base = [{ key: "welcome-kim-intro", role: "ai", text: welcomeText }, ...base];
      }
    }

    return [...base, ...optimisticMsgs];
  }, [uiMessages, cachedMessages, chatHistory, optimistic, productName]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [renderedMessages, isLoading]);

  // When real assistant messages arrive, clear all optimistic streams to avoid duplicates
  useEffect(() => {
    if (uiMessages && uiMessages.length) {
      setOptimistic([]);
      // Persist to localStorage for this thread
      try {
        const simple = uiMessages.map((m) => ({ role: m.role === "user" ? "user" : "ai", text: uiMessageText(m) }));
        localStorage.setItem(`kim_msgs_${threadId} `, JSON.stringify(simple));
        setCachedMessages(simple);
      } catch { }
    }
  }, [uiMessages, threadId]);

  async function handleAsk() {
    const q = input.trim();
    if (!q || isLoading) return;
    setInput("");
    setIsLoading(true);
    setSources([]); // Clear sources to show shimmer for every new request
    try {
      if (threadId) {
        // Optimistically add, but immediately replace with local cache to avoid duplicates
        const pendingKey = `op-${Date.now()}`;
        setOptimistic((ops) => [...ops, { key: pendingKey, role: "user", text: q }]);
        // Device-only persistence: write-through user message now and remove optimistic user
        appendLocalMsg(threadId, "user", q);
        setOptimistic((ops) => ops.filter((m) => m.key !== pendingKey));
        try {
          // Route normal chat via server (non-stream)
          const res = await convex.action("kimAgent:ask", {
            threadId,
            question: q,
            product: disableProductFilter ? undefined : productName,
            mode: "auto",
          });
          console.log('📊 RAW Agent response:', res);
          console.log('📊 res.sources type:', typeof res?.sources, 'isArray:', Array.isArray(res?.sources));
          console.log('📊 res.sources:', res?.sources);
          const top = Array.isArray(res?.sources) ? res.sources : [];
          console.log('📊 Extracted top:', top.length, 'reviews');
          if (top.length) {
            console.log('✅ Setting sources to state');
            setSources(top);
          } else {
            console.error('❌ No sources to set! top.length =', top.length);
          }

          // Update suggestions immediately from agent response
          if (Array.isArray(res?.suggestions) && res.suggestions.length) {
            setSuggestions(res.suggestions);
          }

          // Log question to Convex for analytics
          if (shopDomain && res?.answer) {
            try {
              // Extract simplified source reviews for storage
              const sourcesToLog = Array.isArray(top) ? top.slice(0, 5).map((s) => {
                const r = s.doc || s;
                return {
                  author: r.author_name || r.reviewer || "Anonymous",
                  rating: r.rating || 5,
                  review_body: (r.review_body || "").slice(0, 200),
                };
              }) : [];

              await convex.mutation("questions:logQuestion", {
                shopify_domain: shopDomain,
                question: q,
                answer: String(res.answer).slice(0, 500),
                product: productName,
                threadId: threadId,
                sources: sourcesToLog,
              });
              console.log("✅ Question logged to Convex with", sourcesToLog.length, "sources");
            } catch (logErr) {
              console.warn("Failed to log question:", logErr);
            }
          }

          // If UI messages aren't in yet, locally stream assistant so it feels live
          if (res?.answer && (!uiMessages || uiMessages.length === 0)) {
            const streamKey = `op-assistant-${Date.now()}`;
            const full = String(res.answer);
            setOptimistic((ops) => [...ops, { key: streamKey, role: "ai", text: "" }]);
            let i = 0;
            const step = 6; // slower chunk size
            await new Promise((resolve) => {
              const stream = () => {
                i += step;
                const next = full.slice(0, i);
                setOptimistic((ops) => ops.map((o) => (o.key === streamKey ? { ...o, text: next } : o)));
                if (i < full.length) {
                  setTimeout(stream, 45);
                } else {
                  // Streaming complete: persist assistant message to device cache and remove optimistic AI bubble
                  appendLocalMsg(threadId, "ai", full);
                  setOptimistic((ops) => ops.filter((o) => o.key !== streamKey));
                  resolve();
                }
              };
              stream();
            });
          }
        } finally {
          // Keep loading and user bubble until stream completes
          setIsLoading(false);
        }
      } else {
        // Fallback to classic chat action if thread not available
        const res = await convex.action("chat:ask", {
          query: q,
          topK: 8,
          product: disableProductFilter ? undefined : productName,
          research: false,
        });
        const { answer, sources: top3, suggestions: sug } = res || {};
        setChatHistory((m) => [
          ...m,
          { role: "user", text: q },
          {
            role: "ai",
            text:
              (answer && String(answer).trim()) ||
              "I’m having trouble answering that directly from reviews. Try asking about fit, comfort, or how it feels to wear.",
          },
        ]);
        setSources(Array.isArray(top3) ? top3 : []);
        if (Array.isArray(sug) && sug.length) setSuggestions(sug);
        setIsLoading(false);
      }
    } catch (e) {
      console.error(e);
      setChatHistory((m) => [
        ...m,
        {
          role: "ai",
          text:
            "I’m having trouble answering that directly from reviews. Try asking about fit, comfort, or how it feels to wear.",
        },
      ]);
      setIsLoading(false);
    }
  }

  function onCsvSelected(file) {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data || [];

          function looseParseJson(s) {
            if (!s || typeof s !== "string") return null;
            const t = s.trim();
            if (!t.startsWith("{") || !t.endsWith("}")) return null;
            try { return JSON.parse(t); } catch (e) {
              try { return JSON.parse(t.replace(/'/g, '"').replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false')); } catch { return null; }
            }
          }

          const seen = new Set();
          const cleaned = rows
            .map((r, i) => {
              let body = r.review_body || r.body || "";
              const parsed = looseParseJson(body);
              if (parsed) {
                body = parsed.body || parsed.review_body || body;
                r.author_name = r.author_name || (parsed.authorProfile?.displayName || parsed.authorProfile?.author || parsed.displayName || parsed.author);
                r.rating = r.rating || parsed.rating;
                r.fit_feedback = r.fit_feedback || parsed.fitFeedback;
                r.created_at = r.created_at || parsed.dateCreated || parsed.createdAt;
              }
              const row = {
                id: r.id || `csv_${Date.now()}_${i} `,
                external_id: r.external_id || r.id || parsed?.id,
                product: r.product || (disableProductFilter ? PRODUCT_NAME : productName),
                author_name: r.author_name || "(Anonymous)",
                rating: Number(r.rating || 0),
                fit_feedback: r.fit_feedback || "",
                review_body: String(body || ""),
                created_at: r.created_at || new Date().toISOString(),
              };
              const sig = row.external_id ? `ext:${row.external_id} ` : `sig:${row.product}:${row.author_name}:${row.review_body.slice(0, 140)} `;
              if (seen.has(sig)) return null;
              seen.add(sig);
              return row;
            })
            .filter(Boolean);

          // Stream in chunks to show progress
          const chunkSize = 20;
          for (let i = 0; i < cleaned.length; i += chunkSize) {
            const chunk = cleaned.slice(i, i + chunkSize);
            await convex.action("reviews:bulkUpsertEmbedded", { reviews: chunk });
            setUploadProgress(Math.round(((i + chunk.length) / cleaned.length) * 100));
          }

          // Normalize and dedupe existing records server-side as a final pass
          try { await convex.action("reviews:normalizeAndDedupe", {}); } catch { }
        } catch (e) {
          console.error(e);
          alert("Upload failed. See console.");
        } finally {
          setUploading(false);
        }
      },
      error: (err) => {
        console.error(err);
        setUploading(false);
      },
    });
  }

  // Fetch total review count for product panel
  useEffect(() => {
    (async () => {
      try {
        console.log('🔢 Fetching review count from Convex...');
        const n = await convex.query("reviews:count", {});
        console.log('🔢 Review count received:', n);
        if (typeof n === "number") setReviewCount(n);
      } catch (err) {
        console.error('❌ Failed to fetch review count:', err);
      }
    })();
  }, []);

  // New Chat: clear thread and start fresh
  function handleNewChat() {
    if (window.confirm("Start a new chat? This will clear your current conversation.")) {
      // Clear localStorage
      if (threadId) {
        localStorage.removeItem(`kim_msgs_${threadId} `);
        localStorage.removeItem(`kim_demo_msgs_${threadId} `);
      }
      localStorage.removeItem("kim_thread_id");
      localStorage.removeItem("kim_demo_thread_id");
      // Reset state
      setThreadId(null);
      setUIMessages([]);
      setCachedMessages([]);
      setOptimistic([]);
      setChatHistory([{
        role: "ai",
        text: `Ask me anything about the ${productName} – fit, comfort, what to wear it under, you name it.`,
      }]);
      setSources([]);
      setSuggestions([
        "What do tall buyers say about the fit?",
        "Does the fabric pill?",
        "Is it good for daily wear?",
      ]);
      // Will trigger new thread creation on next mount
      window.location.reload();
    }
  }

  // Modal markup used by both embed mode and full-page widget mode
  const modal = (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (min-width: 1024px) {
          .reco-sidebar-visibility {
            display: flex !important;
          }
        }
        @media (max-width: 1023px) {
          .reco-sidebar-visibility.empty {
            display: none !important;
          }
          .mobile-hide-last:nth-child(n+3) {
            display: none !important;
          }

          .mobile-header-tight {
            padding: 8px !important;
          }
          .reco-suggestion-chip {
            padding-top: 0px !important;
            padding-bottom: 0px !important;
            line-height: 1 !important;
            min-height: 0 !important;
            height: 20px !important;
            display: flex !important;
            align-items: center !important;
          }
          
          /* MOBILE FULLSCREEN OVERRIDES */
          .reco-mobile-fullscreen-container {
            padding: 0 !important;
          }
          .reco-mobile-fullscreen-backdrop {
            background: #FAF8F5 !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          .reco-mobile-fullscreen-layout {
            height: 100vh !important;
            height: 100dvh !important;
            max-height: none !important;
          }
          .reco-mobile-fullscreen-sidebar {
            display: none !important;
          }
          .reco-mobile-fullscreen-chat {
            height: 100vh !important;
            height: 100dvh !important;
            max-height: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
      <div
        className="reco-mobile-fullscreen-container fixed inset-0 z-[2147483647] flex"
        style={isMobile
          ? { padding: 0, alignItems: 'stretch', justifyContent: 'stretch' }
          : { padding: '1rem', alignItems: 'center', justifyContent: 'center' }
        }
      >
        {/* Backdrop */}
        <div
          className="reco-mobile-fullscreen-backdrop absolute inset-0"
          style={isMobile
            ? { background: '#FAF8F5' }
            : { background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }
          }
          onClick={() => setWidgetMode(false)}
        />

        {/* Main Layout Container (Absolute Positioning for Gliding) */}
        <div
          className="reco-mobile-fullscreen-layout relative w-full flex pointer-events-none"
          style={isMobile
            ? { height: '100dvh', maxHeight: 'none', maxWidth: '100%', flexDirection: 'column', alignItems: 'stretch' }
            : { height: '90vh', maxHeight: '900px', maxWidth: '1200px', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }
          }
        >

          {/* Sidebar Card (Glides Behind) - HIDDEN on mobile */}
          <aside
            className={`reco-mobile-fullscreen-sidebar pointer-events-auto bg-[#FAF8F5] rounded-3xl shadow-2xl flex-col min-h-0 h-auto lg:h-full overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)] relative lg:absolute w-full lg:w-[450px] lg:top-0 lg:bottom-0
                ${isSidebarOpen
                ? "lg:translate-x-[-610px] z-10 opacity-100 scale-100 lg:left-1/2"
                : "lg:translate-x-[-475px] z-0 opacity-100 scale-95 lg:left-1/2 brightness-[0.98]"}`}
            style={{ display: isMobile ? 'none' : 'flex' }}
          >
            {/* Hide Button */}


            {/* Sidebar Content */}
            <div className="flex flex-col h-full overflow-hidden px-4 py-4 lg:p-6 relative z-10 w-full opacity-100">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4 ai-style-change-1 max-lg:hidden">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {productImageUrl ? (
                    <img src={productImageUrl} alt={productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="material-symbols-outlined text-xl">image</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm leading-[1.5]">{productName}</div>
                  <div className="text-sm text-gray-500 font-medium leading-none">Top Referenced Reviews • {sources.length} shown</div>
                </div>
              </div>

              {/* Sources List */}
              <div className="reco-sources-list flex-1 overflow-x-auto lg:overflow-y-auto min-h-0 flex lg:flex-col gap-3 lg:space-y-0 lg:pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {(isLoading && !sources.length) ? (
                  // Detailed Skeleton - 6 cards with "blocks"
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 animate-pulse w-full lg:flex-shrink-0 lg:w-[280px]">
                      <div className="flex justify-between items-center mb-3">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(k => <div key={k} className="w-3 h-3 bg-gray-200 rounded-full"></div>)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-[90%]"></div>
                        <div className="h-3 bg-gray-200 rounded w-[80%]"></div>
                      </div>
                    </div>
                  ))
                ) : !sources.length ? (
                  <div className="rounded-2xl bg-white p-4 text-center text-sm text-gray-400 border border-gray-100 shadow-sm w-full lg:w-auto lg:flex-shrink-0 lg:w-[280px] min-h-[100px] flex items-center justify-center">
                    Ask a question to see matching reviews here.
                  </div>
                ) : (
                  sources.map((s) => {
                    const r = s.doc || s;
                    return (
                      <div key={s._id || r._id || r.id} className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 flex-shrink-0 w-[280px] lg:w-auto">
                        <div className="flex items-center justify-between mb-0">
                          <div className="text-sm font-bold text-gray-900">{cleanAuthorName(r.author_name || r.reviewer)}</div>
                          <Stars rating={r.rating} />
                        </div>
                        <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap break-words">
                          {cleanReviewBody(r.review_body)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>




          {/* Chat Card (Glides to Center) - FULLSCREEN on mobile */}
          <div
            className={`reco-mobile-fullscreen-chat pointer-events-auto bg-[#FAF8F5] shadow-2xl flex flex-col min-w-0 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)] relative lg:absolute w-full lg:w-[750px] lg:top-0 lg:bottom-0
              ${isSidebarOpen
                ? "lg:translate-x-[-140px] z-10 lg:left-1/2"
                : "lg:translate-x-[-50%] z-20 lg:left-1/2 shadow-3xl"}`}
            style={isMobile
              ? { flex: 1, height: '100%', maxHeight: 'none', borderRadius: 0 }
              : { height: '100%', maxHeight: 'none', borderRadius: '1.5rem' }
            }
          >



            {/* Header */}
            <div className="reco-modal-header mobile-header-tight flex-none !p-2 lg:!px-6 lg:!pt-6 lg:!pb-4 flex w-full justify-between items-center relative z-10 bg-transparent">
              {/* Shop Logo */}
              {shopLogoUrl ? (
                <img
                  src={shopLogoUrl}
                  alt="Store logo"
                  className="h-[22px] lg:h-[27px] max-w-[90px] lg:max-w-[102px] object-contain ml-2 lg:ml-0 mr-1 lg:mr-0"
                />
              ) : <div className="w-8" />}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setWidgetMode(false)}
                className="bg-transparent text-gray-600 w-8 h-8 rounded-full hover:text-black hover:bg-gray-200 transition-all flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat Section */}
            <section className="flex flex-col flex-1 min-h-0 gap-0 overflow-hidden bg-[#FAF8F5]">
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:pl-6 lg:pr-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-4">
                {renderedMessages.map((m, idx) => (
                  <ChatBubble key={m.key} role={m.role} text={m.text} className={idx === 0 ? "!mt-0" : ""} />
                ))}

                {isLoading && (
                  <div className="flex justify-start my-2">
                    <div className="max-w-lg rounded-2xl px-3 py-2 bg-white text-gray-800 shadow-sm border border-gray-100">
                      <LoadingDots />
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestion chips */}
              <div className="flex items-center justify-center py-2 lg:mt-2 flex-shrink-0">
                <div className="flex flex-wrap gap-1 lg:gap-2 justify-center">
                  {suggestions.map((s, i) => (
                    <button
                      key={`${s}-${i}`}
                      onClick={() => setInput(s)}
                      className="reco-suggestion-chip mobile-hide-last bg-gray-100 text-gray-800 px-2 lg:px-3 lg:!py-1.5 rounded-full hover:bg-gray-200 transition-colors text-[10px] lg:text-xs font-medium shadow-sm leading-none"
                      style={{ lineHeight: '1' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input bar */}
              <div className="mt-0 lg:mt-2 px-4 pb-4 lg:px-6 lg:pb-6 flex-shrink-0">
                <div className="relative w-full">
                  <input
                    style={{ backgroundColor: "white" }}
                    className="reco-modal-input w-full bg-white rounded-full pl-5 pr-24 py-3 text-sm text-gray-800 placeholder-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    placeholder="Ask anything about the bodysuit..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAsk();
                    }}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleAsk}
                    disabled={!input.trim() || isLoading}
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition ${!input.trim() || isLoading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#2D2D2D] text-white hover:opacity-90"
                      }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Mobile Reviews Section - Horizontal scroll below input */}
              {isMobile && (
                <div className="flex-shrink-0 px-4 pb-4">
                  <div className="text-xs font-semibold text-gray-500 mb-2">
                    {sources.length > 0 ? `Top Reviews • ${sources.length} shown` : 'Ask a question to see reviews'}
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {(isLoading && !sources.length) ? (
                      // Skeleton cards
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-[220px] p-3 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse">
                          <div className="flex justify-between mb-2">
                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(k => <div key={k} className="w-2 h-2 bg-gray-200 rounded-full"></div>)}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="h-2.5 bg-gray-200 rounded w-full"></div>
                            <div className="h-2.5 bg-gray-200 rounded w-[90%]"></div>
                            <div className="h-2.5 bg-gray-200 rounded w-[75%]"></div>
                          </div>
                        </div>
                      ))
                    ) : sources.length === 0 ? (
                      <div className="flex-shrink-0 w-[220px] p-3 bg-white rounded-xl border border-gray-100 shadow-sm text-center text-xs text-gray-400">
                        Reviews will appear here
                      </div>
                    ) : (
                      sources.map((s) => {
                        const r = s.doc || s;
                        return (
                          <div key={s._id || r._id || r.id} className="flex-shrink-0 w-[220px] p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <div className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">
                                {cleanAuthorName(r.author_name || r.reviewer)}
                              </div>
                              <Stars rating={r.rating} />
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                              {cleanReviewBody(r.review_body)}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );

  if (widgetMode) return createPortal(modal, document.body);

  // Embed mode: inline launcher + modal
  if (embedMode) {
    const openWithCurrentInput = () => {
      if (!widgetMode) setWidgetMode(true);
      if (input.trim()) {
        handleAsk();
      }
    };

    return (
      <>
        <div className="flex items-center justify-center px-4 py-1 relative">
          <div
            className="group cursor-pointer w-full max-w-2xl bg-[#FAF8F5] rounded-[20px] shadow-lg border border-gray-100 px-6 py-5 relative flex items-start gap-0 hover:shadow-xl transition-all duration-300"
            onClick={() => {
              // Focus the textarea when clicking the container
              document.getElementById('reco-inline-input')?.focus();
            }}
          >
            {/* Left Icon (Stars Only - Proportional & Rounded) */}
            <div className="absolute left-[14px] top-5 text-black">
              <svg width="24" height="24" viewBox="0 0 34 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Large Star - Symmetric Sparkle */}
                <path
                  d="M14 3C15 9 19 12 24 12C19 12 15 15 14 21C13 15 9 12 4 12C9 12 13 9 14 3Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Top Right Small Star (Standard Height: x=28, y=3.5, h=7) */}
                <path
                  d="M28 1C28.3 2.5 29.5 3.5 31 3.5C29.5 3.5 28.3 4.5 28 6C27.7 4.5 26.5 3.5 25 3.5C26.5 3.5 27.7 2.5 28 1Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Bottom Right Small Star (Height 5px: x=28, y=17.5) */}
                <path
                  d="M28 15C28.3 16.5 29.5 17.5 31 17.5C29.5 17.5 28.3 18.5 28 20C27.7 18.5 26.5 17.5 25 17.5C26.5 17.5 27.7 16.5 28 15Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Text Column */}
            <div className="flex-1 min-w-0 mr-12 ml-[20.5px]">
              {/* Title Line */}
              <div className="font-bold text-gray-900 text-sm leading-none mb-[1px]">
                Ask anything about this product...
              </div>

              {/* Subtitle / Input Line */}
              <div className="relative w-full">
                {/* Animated Placeholder (Visible when input is empty) */}
                {!input && (
                  <div className="absolute inset-0 pointer-events-none text-gray-500 font-normal truncate">
                    <SlidingSuggestions
                      words={["What do tall buyers say about the fit?", "Does the fabric pill?", "Is it good for daily wear?"]}
                      isFocused={isInputFocused}
                    />
                  </div>
                )}
                {/* Real Input */}
                <textarea
                  id="reco-inline-input"
                  className="w-full bg-transparent border-none outline-none text-sm text-gray-700 font-normal placeholder-transparent focus:ring-0 p-0 resize-none overflow-hidden"
                  rows={1}
                  style={{ minHeight: '1.25rem' }}
                  value={input}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && input.trim()) {
                      e.preventDefault();
                      setWidgetMode(true);
                      setTimeout(() => handleAsk(), 100);
                    }
                  }}
                />
              </div>
            </div>

            {/* Arrow Button (Bottom Right) */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (input.trim()) {
                  setWidgetMode(true);
                  setTimeout(() => handleAsk(), 100);
                } else {
                  setWidgetMode(true);
                }
              }}
              className="absolute bottom-4 right-4 w-10 h-10 bg-[#2D2D2D] text-white rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors duration-300 z-10 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
              </svg>
            </div>
          </div>
          <div className="absolute -bottom-6 w-full text-center text-[10px] text-gray-300 font-mono pointer-events-none">v304</div>
        </div >
        {widgetMode && createPortal(modal, document.body)
        }
      </>
    );
  }

  // Full UI Mode (original)
  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] text-gray-800">
      {/* Toggle to Widget Mode Button */}
      <button
        onClick={() => {
          console.log('Entering widget mode');
          setIsMinimized(false);
          setWidgetMode(true);
        }}
        className="fixed top-6 right-6 z-50 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full shadow-lg transition-all text-sm font-medium flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        Widget Mode
      </button>

      {/* Header */}
      <header className="px-6 pt-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img src="/skims_logo-removebg-preview.png" alt="Skims" className="h-7 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleNewChat}
              title="Start a new conversation"
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-xl">refresh</span>
              New Chat
            </button>
            <button
              type="button"
              disabled={UPLOADS_DISABLED || uploading}
              title={UPLOADS_DISABLED ? "Uploads are disabled for this demo" : "Upload CSV"}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors text-sm font-medium ${UPLOADS_DISABLED
                ? "bg-gray-200 text-gray-500 opacity-50 cursor-not-allowed"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } `}
            >
              <span className="material-symbols-outlined text-xl">upload</span>
              {UPLOADS_DISABLED ? "Uploads disabled" : (uploading ? `Uploading ${uploadProgress}% ` : "Upload csv")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => onCsvSelected(e.target.files?.[0])}
              disabled={true}
            />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Left: Chat */}
        <section className="lg:col-span-2">
          {/* Conversation */}
          <div ref={scrollRef} className="h-[62vh] overflow-y-auto pt-6">
            {renderedMessages.map((m) => (
              <ChatBubble key={m.key} role={m.role} text={m.text} />
            ))}
            {isLoading && (
              <div className="flex justify-start my-2">
                <div className="max-w-lg rounded-2xl px-4 py-3 bg-white text-gray-800 shadow-sm">
                  <LoadingDots />
                </div>
              </div>
            )}
          </div>

          {/* Suggestion chips */}
          <div className="flex items-center justify-center mt-4">
            <div className="flex flex-wrap gap-3 justify-center">
              {suggestions.map((s, i) => (
                <button
                  key={`${s}-${i}`}
                  onClick={() => setInput(s)}
                  className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium shadow-sm border border-gray-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Input bar */}
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <input
                className="flex-1 bg-white rounded-[20px] px-5 py-3 text-sm text-gray-800 placeholder-gray-400 border border-gray-200 focus:outline-none"
                placeholder="Ask anything about the bodysuit..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAsk();
                }}
                disabled={isLoading}
              />
              <button
                onClick={handleAsk}
                disabled={!input.trim() || isLoading}
                className={`px-5 py-3 rounded-[20px] text-sm font-medium transition ${!input.trim() || isLoading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-black text-white hover:opacity-90"
                  } `}
              >
                Send
              </button>
            </div>
          </div>
        </section>

        {/* Right: Live Sources (Redesigned as Product Review Card) */}
        <aside className="lg:col-span-1 bg-[#FDFBF7] rounded-[24px] p-6 shadow-sm border border-[#EBEBEB]">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {productImageUrl ? (
                <img src={productImageUrl} alt={productName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="material-symbols-outlined text-xl">image</span>
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base leading-tight">{productName}</div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">Top Referenced Reviews - {sources.length} shown</div>
            </div>
          </div>

          <div className="space-y-3 max-h-[62vh] overflow-y-auto pr-1">
            {!sources.length ? (
              <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-400 border border-gray-100 shadow-sm">
                Ask a question to see matching reviews here.
              </div>
            ) : (
              sources.map((s) => {
                const r = s.doc || s;
                return (
                  <div key={s._id || r._id || r.id} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-0">
                      <div className="text-sm font-bold text-gray-900">{cleanAuthorName(r.author_name || r.reviewer)}</div>
                      <Stars rating={r.rating} />
                    </div>
                    <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap break-words">
                      {cleanReviewBody(r.review_body)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </main>
    </div>

  );
}
