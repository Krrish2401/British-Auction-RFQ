import { Router } from "express";

import { verifyDatabaseConnection } from "../config/database.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "API is healthy"
    });
});

healthRouter.get("/health/db", async (_req, res, next) => {
    try {
        await verifyDatabaseConnection();

        res.status(200).json({
            success: true,
            message: "Database connection is healthy"
        });
    } catch (error) {
        next(error);
    }
});
