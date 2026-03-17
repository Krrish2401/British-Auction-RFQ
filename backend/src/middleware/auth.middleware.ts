import type { Request, Response, NextFunction } from "express";

import { verifyToken } from "../lib/auth.js";

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const token = req.cookies?.auth_token;

    if (!token || typeof token !== "string") {
        res.status(401).json({ error: "Not authenticated" });
        return;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        res.status(401).json({ error: "Invalid or expired session" });
        return;
    }

    req.user = decoded;
    next();
}
