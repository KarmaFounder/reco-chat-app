import pkg from "@react-router/node";
const { createRequestListener } = pkg;

// Import the build
const build = await import("../build/server/index.js");

export default createRequestListener(() => build, {
    mode: process.env.NODE_ENV,
});
