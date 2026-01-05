import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient;
}

// Cache the Prisma client to avoid creating new connections on every request
// In production, we still create a single instance but don't cache globally
const prisma = global.prismaGlobal ?? new PrismaClient();

// Cache the client in development to avoid exhausting connections
if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}

export default prisma;
