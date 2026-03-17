import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

import { env } from "../config/env.js";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({
    connectionString: env.databaseUrl
});

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
