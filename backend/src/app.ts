import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.routes.js";
import { bidRouter } from "./routes/bid.routes.js";
import { healthRouter } from "./routes/health.route.js";
import { rfqRouter } from "./routes/rfq.routes.js";

export const app = express();

app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/rfq", rfqRouter);
app.use("/api/rfq", bidRouter);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled server error", error);

    const isProduction = process.env.NODE_ENV === "production";
    const message = error instanceof Error ? error.message : "Unexpected server error";

    res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: isProduction ? "Internal server error" : message
    });
});
