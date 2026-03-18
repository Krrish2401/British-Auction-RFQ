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
const bidCooldownStore = new Map<string, number>();

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

const BID_COOLDOWN_MS = 12 * 1000;

export function bidCooldownLimit(req: Request, res: Response, next: NextFunction): void {
    const userId = req.user?.userId;
    const rawRfqId = req.params.rfqId;
    const rfqId = Array.isArray(rawRfqId) ? rawRfqId[0] : rawRfqId;

    if (!userId || !rfqId) {
        next();
        return;
    }

    const key = `${userId}:${rfqId}`;
    const now = Date.now();
    const expiresAt = bidCooldownStore.get(key) ?? 0;

    if (expiresAt > now) {
        const retryAfterSeconds = Math.ceil((expiresAt - now) / 1000);
        res.setHeader("Retry-After", String(retryAfterSeconds));
        res.status(429).json({
            error: "Bid cooldown active. Please wait before bidding again on this RFQ."
        });
        return;
    }

    bidCooldownStore.set(key, now + BID_COOLDOWN_MS);
    next();
}
