import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Dedicated build config for the Shopify Theme App Extension widget.
// Usage:
//   npm run build:widget
// which runs: vite build --config vite.widget.config.js
//
// Output:
//   reco/extensions/reco-chat-widget/assets/reco-bundle.js
//
// This does NOT change your existing main app build (vite.config.js).

export default defineConfig(({ mode }) => {
    return {
        plugins: [react()],
        define: {
            "import.meta.env.VITE_CONVEX_URL": JSON.stringify("https://hardy-ermine-604.convex.cloud"),
        },
        build: {
            outDir: resolve(import.meta.dirname, "../reco/extensions/reco-chat-widget/assets"),
            emptyOutDir: false,
            rollupOptions: {
                input: resolve(import.meta.dirname, "widget-main.jsx"),
                output: {
                    entryFileNames: "reco-widget-v304.js",
                    assetFileNames: "reco-[name][extname]",
                },
            },
        },
    };
});
