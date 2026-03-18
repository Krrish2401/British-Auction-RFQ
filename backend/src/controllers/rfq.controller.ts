import { ActivityType, AuctionStatus, Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import type { CreateRFQRequestDto, RFQListItemDto } from "../dto/rfq.dto.js";
import { activateAuctionIfDue, closeAuctionIfDue, computeCurrentRankings } from "../lib/auction-engine.js";
import { censorNameForViewer } from "../lib/censor.js";
import { prisma } from "../lib/prisma.js";
import { generateReferenceId, validateRFQInput } from "../lib/validate.js";

const RFQ_DETAIL_BIDS_LIMIT = 500;
const RFQ_DETAIL_ACTIVITY_LOGS_LIMIT = 300;
const RFQ_DETAIL_EXTENSIONS_LIMIT = 200;

function toListItem(
    rfq: {
        id: string;
        referenceId: string;
        name: string;
        status: "DRAFT" | "ACTIVE" | "CLOSED" | "FORCE_CLOSED";
        bidStartTime: Date;
        bidCloseTime: Date;
        originalBidCloseTime: Date;
        forcedCloseTime: Date;
        pickupDate: Date;
        buyerId: string;
        createdAt: Date;
        updatedAt: Date;
        auctionConfig: {
            id: string;
            rfqId: string;
            triggerWindowMins: number;
            extensionDurationMins: number;
            triggerType: "BID_RECEIVED" | "ANY_RANK_CHANGE" | "L1_CHANGE_ONLY";
            createdAt: Date;
        } | null;
        bids: {
            totalAmount: Prisma.Decimal;
        }[];
    }
): RFQListItemDto {
    const currentLowestBid =
        rfq.bids.length > 0
            ? rfq.bids.reduce((lowest, bid) => {
                if (!lowest || bid.totalAmount.comparedTo(lowest) < 0) {
                    return bid.totalAmount;
                }

                return lowest;
            }, null as Prisma.Decimal | null)
            : null;

    return {
        id: rfq.id,
        referenceId: rfq.referenceId,
        name: rfq.name,
        status: rfq.status,
        bidStartTime: rfq.bidStartTime,
        bidCloseTime: rfq.bidCloseTime,
        originalBidCloseTime: rfq.originalBidCloseTime,
        forcedCloseTime: rfq.forcedCloseTime,
        pickupDate: rfq.pickupDate,
        buyerId: rfq.buyerId,
        createdAt: rfq.createdAt,
        updatedAt: rfq.updatedAt,
        auctionConfig: rfq.auctionConfig,
        currentLowestBid: currentLowestBid ? Number(currentLowestBid.toFixed(2)) : null,
        totalBidCount: rfq.bids.length
    };
}

export async function createRFQ(req: Request, res: Response): Promise<void> {
    if (!req.user || req.user.role !== "BUYER") {
        res.status(403).json({ error: "Forbidden" });
        return;
    }

    const body = req.body as Partial<CreateRFQRequestDto>;
    const errors = validateRFQInput(body);

    if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
    }

    let attempt = 0;

    while (attempt < 3) {
        attempt += 1;
        const referenceId = generateReferenceId();

        try {
            const createdRFQ = await prisma.$transaction(async (tx) => {
                const rfq = await tx.rFQ.create({
                    data: {
                        referenceId,
                        name: body.name!.trim(),
                        buyerId: req.user!.userId,
                        bidStartTime: new Date(body.bidStartTime!),
                        bidCloseTime: new Date(body.bidCloseTime!),
                        originalBidCloseTime: new Date(body.bidCloseTime!),
                        forcedCloseTime: new Date(body.forcedCloseTime!),
                        pickupDate: new Date(body.pickupDate!),
                        status: AuctionStatus.DRAFT
                    }
                });

                await tx.auctionConfig.create({
                    data: {
                        rfqId: rfq.id,
                        triggerWindowMins: body.triggerWindowMins!,
                        extensionDurationMins: body.extensionDurationMins!,
                        triggerType: body.triggerType!
                    }
                });

                return tx.rFQ.findUniqueOrThrow({
                    where: { id: rfq.id },
                    include: {
                        auctionConfig: true
                    }
                });
            });

            await prisma.activityLog.create({
                data: {
                    rfqId: createdRFQ.id,
                    activityType: ActivityType.AUCTION_OPENED,
                    description: `RFQ ${createdRFQ.referenceId} created. Auction scheduled.`
                }
            });

            res.status(201).json(createdRFQ);
            return;
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                continue;
            }

            throw error;
        }
    }

    res.status(500).json({ error: "Failed to create a unique referenceId after 3 attempts" });
}

export async function listRFQs(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
    }

    if (req.user.role === "BUYER") {
        const buyerRfqs = await prisma.rFQ.findMany({
            where: {
                buyerId: req.user.userId
            },
            select: {
                id: true,
                status: true
            }
        });

        for (const rfq of buyerRfqs) {
            if (rfq.status === AuctionStatus.DRAFT || rfq.status === AuctionStatus.ACTIVE) {
                await activateAuctionIfDue(rfq.id);
                await closeAuctionIfDue(rfq.id);
            }
        }

        const enriched = await prisma.rFQ.findMany({
            where: {
                buyerId: req.user.userId
            },
            include: {
                auctionConfig: true,
                bids: {
                    select: {
                        totalAmount: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.status(200).json(enriched.map(toListItem));
        return;
    }

    const now = new Date();

    const activatedRfqs = await prisma.$queryRaw<Array<{ id: string }>>`
        UPDATE "RFQ"
        SET "status" = ${AuctionStatus.ACTIVE}, "updatedAt" = ${now}
        WHERE "status" = ${AuctionStatus.DRAFT}
        AND "bidStartTime" <= ${now}
        RETURNING "id"
    `;

    if (activatedRfqs.length > 0) {
        await prisma.activityLog.createMany({
            data: activatedRfqs.map((rfq) => ({
                rfqId: rfq.id,
                activityType: ActivityType.AUCTION_OPENED,
                description: "Auction is now live. Bidding is open."
            }))
        });
    }

    const forceClosedRfqs = await prisma.$queryRaw<Array<{ id: string }>>`
        UPDATE "RFQ"
        SET "status" = ${AuctionStatus.FORCE_CLOSED}, "updatedAt" = ${now}
        WHERE "status" = ${AuctionStatus.ACTIVE}
        AND "forcedCloseTime" <= ${now}
        RETURNING "id"
    `;

    if (forceClosedRfqs.length > 0) {
        await prisma.activityLog.createMany({
            data: forceClosedRfqs.map((rfq) => ({
                rfqId: rfq.id,
                activityType: ActivityType.AUCTION_FORCE_CLOSED,
                description: "Auction force closed. Hard deadline reached. No further bids accepted."
            }))
        });
    }

    const naturallyClosedRfqs = await prisma.$queryRaw<Array<{ id: string }>>`
        UPDATE "RFQ"
        SET "status" = ${AuctionStatus.CLOSED}, "updatedAt" = ${now}
        WHERE "status" = ${AuctionStatus.ACTIVE}
        AND "bidCloseTime" <= ${now}
        AND "forcedCloseTime" > ${now}
        RETURNING "id"
    `;

    if (naturallyClosedRfqs.length > 0) {
        await prisma.activityLog.createMany({
            data: naturallyClosedRfqs.map((rfq) => ({
                rfqId: rfq.id,
                activityType: ActivityType.AUCTION_CLOSED,
                description: "Auction closed naturally. No further bids accepted."
            }))
        });
    }

    const visibleRfqs = await prisma.rFQ.findMany({
        where: {
            OR: [
                {
                    status: AuctionStatus.ACTIVE
                },
                {
                    bids: {
                        some: {
                            supplierId: req.user.userId
                        }
                    }
                }
            ]
        },
        include: {
            auctionConfig: true,
            bids: {
                select: {
                    totalAmount: true
                }
            }
        },
        orderBy: [
            {
                status: "asc"
            },
            {
                bidCloseTime: "asc"
            }
        ]
    });

    res.status(200).json(visibleRfqs.map(toListItem));
}

export async function getRFQ(req: Request, res: Response): Promise<void> {
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

    const rfqBase = await prisma.rFQ.findUnique({
        where: {
            id: rfqId
        },
        select: {
            id: true,
            buyerId: true,
            status: true
        }
    });

    if (!rfqBase) {
        res.status(404).json({ error: "RFQ not found" });
        return;
    }

    if (req.user.role === "BUYER" && rfqBase.buyerId !== req.user.userId) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }

    if (req.user.role === "SUPPLIER" && rfqBase.status !== AuctionStatus.ACTIVE) {
        const hasParticipated = await prisma.bid.findFirst({
            where: {
                rfqId,
                supplierId: req.user.userId
            },
            select: {
                id: true
            }
        });

        if (!hasParticipated) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
    }

    const rfq = await prisma.rFQ.findUnique({
        where: {
            id: rfqId
        },
        include: {
            auctionConfig: true,
            extensions: {
                orderBy: {
                    createdAt: "desc"
                },
                take: RFQ_DETAIL_EXTENSIONS_LIMIT
            },
            activityLogs: {
                orderBy: {
                    occurredAt: "desc"
                },
                take: RFQ_DETAIL_ACTIVITY_LOGS_LIMIT
            },
            bids: {
                include: {
                    supplier: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    receivedAt: "desc"
                },
                take: RFQ_DETAIL_BIDS_LIMIT
            }
        }
    });

    if (!rfq) {
        res.status(404).json({ error: "RFQ not found" });
        return;
    }

    const rankingsRaw = await computeCurrentRankings(rfqId);
    const rankings = rankingsRaw.map((entry) => ({
        ...entry,
        supplierName:
            req.user?.role === "SUPPLIER"
                ? censorNameForViewer(entry.supplierName, req.user.userId, entry.supplierId)
                : entry.supplierName
    }));

    const rankByBidId = new Map(rankingsRaw.map((entry) => [entry.bidId, entry.rank]));

    const bids = rfq.bids.map((bid) => {
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
            currentRank: rankByBidId.get(bid.id) ?? null
        };
    });

    res.status(200).json({
        ...rfq,
        bids,
        rankings
    });
}





