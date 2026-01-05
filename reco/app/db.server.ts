import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient;
}

// For serverless environments, create a new client with connection pooling configured
// In production on Vercel, each request gets a fresh client to avoid connection pool exhaustion
const prisma = global.prismaGlobal ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Log slow queries in production for debugging
  log: process.env.NODE_ENV === "production" ? ["error", "warn"] : ["query", "error", "warn"],
});

// Cache the client in development to avoid creating too many connections
if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}

export default prisma;
