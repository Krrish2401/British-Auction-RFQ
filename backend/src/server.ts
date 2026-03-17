import { app } from "./app.js";
import { closeDatabaseConnection, verifyDatabaseConnection } from "./config/database.js";
import { env } from "./config/env.js";

let isShuttingDown = false;

async function startServer(): Promise<void> {
    await verifyDatabaseConnection();
    console.log("Connected to PostgreSQL (Neon).");

    const server = app.listen(env.port, () => {
        console.log(`Server running on http://localhost:${env.port}`);
    });

    const gracefulShutdown = async (signal: NodeJS.Signals): Promise<void> => {
        if (isShuttingDown) {
            return;
        }

        isShuttingDown = true;
        console.log(`${signal} received. Shutting down gracefully...`);

        server.close(async () => {
            await closeDatabaseConnection();
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
