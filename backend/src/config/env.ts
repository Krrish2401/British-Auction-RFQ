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

if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error("PORT must be a positive integer.");
}

export const env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: parsedPort,
    databaseUrl: getRequiredEnv("DATABASE_URL"),
    jwtSecret: getRequiredEnv("JWT_SECRET")
} as const;
