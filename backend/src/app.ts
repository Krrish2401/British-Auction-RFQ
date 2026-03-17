import express from "express";

import { healthRouter } from "./routes/health.route.js";

export const app = express();

app.use(express.json());
app.use("/api", healthRouter);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Unexpected server error";

    res.status(500).json({
        success: false,
        message
    });
});
