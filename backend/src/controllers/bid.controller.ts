import { AuctionStatus, Prisma } from "@prisma/client";
import type { Request, Response } from "express";

import {
    activateAuctionIfDue,
    closeAuctionIfDue,
    computeCurrentRankings,
    processBid
} from "../lib/auction-engine.js";
import { censorNameForViewer } from "../lib/censor.js";
import { prisma } from "../lib/prisma.js";

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listBids(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
    }

    const rawRfqId = req.params.rfqId;
    const rfqId = Array.isArray(rawRfqId) ? rawRfqId[0] : rawRfqId;

    if (!rfqId) {
        res.status(400).json({ error: "rfqId is required" });
        return;
    }

    await activateAuctionIfDue(rfqId);
    await closeAuctionIfDue(rfqId);

    const rfq = await prisma.rFQ.findUnique({
        where: { id: rfqId },
        select: {
            buyerId: true,
            status: true,
            bids: {
                where: {
                    supplierId: req.user.userId
                },
                select: {
                    id: true
                },
                take: 1
            }
        }
    });

    if (!rfq) {
        res.status(404).json({ error: "RFQ not found" });
        return;
    }

    if (req.user.role === "BUYER" && rfq.buyerId !== req.user.userId) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }

    if (
        req.user.role === "SUPPLIER" &&
        rfq.status !== AuctionStatus.ACTIVE &&
        rfq.bids.length === 0
    ) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }

    const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const requestedLimit = rawLimit ? Number(rawLimit) : 100;
    const limit = Number.isFinite(requestedLimit) ? clamp(Math.floor(requestedLimit), 1, 200) : 100;
    const rawCursor = Array.isArray(req.query.cursor) ? req.query.cursor[0] : req.query.cursor;
    const cursor = typeof rawCursor === "string" && rawCursor.trim() ? rawCursor : null;

    const bids = await prisma.bid.findMany({
        where: { rfqId },
        include: {
            supplier: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            receivedAt: "asc"
        },
        take: limit,
        ...(cursor
            ? {
                skip: 1,
                cursor: {
                    id: cursor
                }
            }
            : {})
    });

    const rankings = await computeCurrentRankings(rfqId);
    const rankBySupplier = new Map(rankings.map((ranking) => [ranking.supplierId, ranking.rank]));

    const items = bids.map((bid) => {
        const supplierName =
            req.user?.role === "SUPPLIER"
                ? censorNameForViewer(bid.supplier.name, req.user.userId, bid.supplierId)
                : bid.supplier.name;

        return {
            ...bid,
            supplier: {
                ...bid.supplier,
                name: supplierName
            },
            currentRank: rankBySupplier.get(bid.supplierId) ?? null
        };
    });

    const nextCursor = items.length === limit ? items[items.length - 1]?.id ?? null : null;

    res.status(200).json({
        items,
        nextCursor
    });
}

export async function submitBid(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
    }

    if (req.user.role !== "SUPPLIER") {
        res.status(403).json({ error: "Forbidden" });
        return;
    }

    const rawRfqId = req.params.rfqId;
    const rfqId = Array.isArray(rawRfqId) ? rawRfqId[0] : rawRfqId;

    if (!rfqId) {
        res.status(400).json({ error: "rfqId is required" });
        return;
    }

    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            const result = await processBid(rfqId, req.user.userId, req.body);
            res.status(201).json(result);
            return;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
                if (attempt < maxAttempts) {
                    const jitterMs = Math.floor(Math.random() * 60);
                    await sleep(40 * attempt + jitterMs);
                    continue;
                }

                res.status(409).json({ error: "Conflict, please retry" });
                return;
            }

            if (error instanceof Error) {
                const message = error.message;
                if (
                    message.startsWith("Auction is not accepting bids") ||
                    message.startsWith("Bid received after auction close time") ||
                    message.startsWith("Validation failed") ||
                    message.startsWith("RFQ not found")
                ) {
                    res.status(400).json({ error: message });
                    return;
                }
            }

            res.status(500).json({ error: "Internal server error" });
            return;
        }
    }
}
