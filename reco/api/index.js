import { createRequestHandler } from "@react-router/node";

// Import the build - the build is bundled by Vercel
const build = await import("../build/server/index.js");

export default createRequestHandler({
    build,
    mode: process.env.NODE_ENV,
});
