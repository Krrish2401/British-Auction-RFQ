import type { NextFunction, Request, Response } from "express";

type RateLimitOptions = {
    windowMs: number;
    maxRequests: number;
    keyPrefix: string;
};

type Entry = {
    count: number;
    resetAt: number;
};

const store = new Map<string, Entry>();

function buildKey(req: Request, keyPrefix: string): string {
    const ip = req.ip ?? "unknown";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

    return `${keyPrefix}:${ip}:${email}`;
}

function createRateLimiter(options: RateLimitOptions) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const now = Date.now();
        const key = buildKey(req, options.keyPrefix);
        const current = store.get(key);

        if (!current || current.resetAt <= now) {
            store.set(key, {
                count: 1,
                resetAt: now + options.windowMs
            });
            next();
            return;
        }

        if (current.count >= options.maxRequests) {
            const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
            res.setHeader("Retry-After", String(retryAfterSeconds));
            res.status(429).json({
                error: "Too many requests. Please try again later."
            });
            return;
        }

        current.count += 1;
        next();
    };
}

export const loginRateLimit = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: "auth-login"
});

export const registerRateLimit = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 5,
    keyPrefix: "auth-register"
});
