import dotenv from "dotenv";
dotenv.config();

function getRequiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

const portValue = process.env.PORT ?? "4000";
const parsedPort = Number(portValue);
const jwtSecret = getRequiredEnv("JWT_SECRET");

if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error("PORT must be a positive integer.");
}

if (jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long.");
}

export const env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: parsedPort,
    databaseUrl: getRequiredEnv("DATABASE_URL"),
    jwtSecret
} as const;
