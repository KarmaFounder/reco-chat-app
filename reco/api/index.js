import pkg from "@react-router/node";
const { createRequestListener } = pkg;

// Import the build - dynamic import returns the module
const build = await import("../build/server/index.js");

// Pass the build directly - it has routes, entry, assets, etc.
export default createRequestListener(build, {
    mode: process.env.NODE_ENV,
});
