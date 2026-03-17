import type { NextFunction, Request, Response } from "express";

export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const currentRole = req.user?.role;

        if (!currentRole || !roles.includes(currentRole)) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }

        next();
    };
}
