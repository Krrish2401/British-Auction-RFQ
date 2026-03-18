import { prisma } from "../lib/prisma.js";

export async function verifyDatabaseConnection(): Promise<void> {
    await prisma.$connect();
}

export async function closeDatabaseConnection(): Promise<void> {
    await prisma.$disconnect();
}
