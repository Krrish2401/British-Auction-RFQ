import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

import {
    activateAuctionIfDue,
    closeAuctionIfDue,
    computeCurrentRankings,
    processBid
} from "../lib/auction-engine.js";
import { censorNameForViewer } from "../lib/censor.js";
import { prisma } from "../lib/prisma.js";

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
        }
    });

    const rankings = await computeCurrentRankings(rfqId);
    const rankBySupplier = new Map(rankings.map((ranking) => [ranking.supplierId, ranking.rank]));

    const response = bids.map((bid) => {
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

    res.status(200).json(response);
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

    try {
        const result = await processBid(rfqId, req.user.userId, req.body);
        res.status(201).json(result);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
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
    }
}
