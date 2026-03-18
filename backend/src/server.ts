import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

let isShuttingDown = false;

async function startServer(): Promise<void> {
    await prisma.$connect();
    console.log("Connected to Database.");

    const server = app.listen(env.port, () => {
        console.log(`Server running on port ${env.port}`);
    });

    const gracefulShutdown = async (signal: NodeJS.Signals): Promise<void> => {
        if (isShuttingDown) {
            return;
        }

        isShuttingDown = true;
        console.log(`${signal} received. Shutting down gracefully...`);

        server.close(async () => {
            await prisma.$disconnect();
            process.exit(0);
        });
    };

    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);
}

startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
