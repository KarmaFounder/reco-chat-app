import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
const CONVEX_AUTH_TOKEN = import.meta.env.VITE_CONVEX_AUTH_TOKEN;

if (!CONVEX_URL) {
  console.warn("VITE_CONVEX_URL missing. Set it in .env.local");
}

export const convex = new ConvexHttpClient(CONVEX_URL || "");

if (CONVEX_AUTH_TOKEN) {
  convex.setAuth(() => CONVEX_AUTH_TOKEN);
}
