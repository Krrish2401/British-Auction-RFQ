import {
    ActivityType,
    AuctionStatus,
    ExtensionTriggerType,
    type AuctionExtension,
    Prisma,
    type PrismaClient
} from "@prisma/client";
import type { SubmitBidRequestDto } from "../dto/bid.dto.js";
import { censorName } from "./censor.js";
import { prisma } from "./prisma.js";

type DbClient = PrismaClient | Prisma.TransactionClient;

type RFQWithConfig = {
    id: string;
    status: AuctionStatus;
    bidStartTime: Date;
    bidCloseTime: Date;
    forcedCloseTime: Date;
    auctionConfig: {
        triggerWindowMins: number;
        extensionDurationMins: number;
        triggerType: ExtensionTriggerType;
    } | null;
};

export type RankingEntry = {
    supplierId: string;
    supplierName: string;
    bidId: string;
    totalAmount: Prisma.Decimal;
    rank: number;
    receivedAt: Date;
};

function resolveDbClient(dbClient?: DbClient): DbClient {
    return dbClient ?? prisma;
}

function formatMoney(amount: Prisma.Decimal | number): string {
    const numeric = amount instanceof Prisma.Decimal ? Number(amount.toFixed(2)) : amount;
    return `$${numeric.toFixed(2)}`;
}

function hasRankChanged(before: RankingEntry[], after: RankingEntry[]): boolean {
    const beforeMap = new Map(before.map((entry) => [entry.supplierId, entry.rank]));

    for (const entry of after) {
        const previousRank = beforeMap.get(entry.supplierId);
        if (previousRank === undefined || previousRank !== entry.rank) {
            return true;
        }
    }

    return false;
}

export async function computeCurrentRankings(rfqId: string, dbClient?: DbClient): Promise<RankingEntry[]> {
    const db = resolveDbClient(dbClient);
    const bids = await db.bid.findMany({
        where: { rfqId },
        include: {
            supplier: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            receivedAt: "desc"
        }
    });

    const latestBidBySupplier = new Map<string, (typeof bids)[number]>();

    for (const bid of bids) {
        if (!latestBidBySupplier.has(bid.supplierId)) {
            latestBidBySupplier.set(bid.supplierId, bid);
        }
    }

    const latestBids = Array.from(latestBidBySupplier.values()).sort((a, b) => {
        const amountDiff = a.totalAmount.comparedTo(b.totalAmount);

        if (amountDiff !== 0) {
            return amountDiff;
        }

        return a.receivedAt.getTime() - b.receivedAt.getTime();
    });

    return latestBids.map((bid, index) => ({
        supplierId: bid.supplierId,
        supplierName: bid.supplier.name,
        bidId: bid.id,
        totalAmount: bid.totalAmount,
        rank: index + 1,
        receivedAt: bid.receivedAt
    }));
}

export async function activateAuctionIfDue(rfqId: string, dbClient?: DbClient): Promise<void> {
    const db = resolveDbClient(dbClient);
    const now = new Date();

    const result = await db.rFQ.updateMany({
        where: {
            id: rfqId,
            status: AuctionStatus.DRAFT,
            bidStartTime: {
                lte: now
            }
        },
        data: {
            status: AuctionStatus.ACTIVE
        }
    });

    if (result.count === 0) {
        return;
    }

    await db.activityLog.create({
        data: {
            rfqId,
            activityType: ActivityType.AUCTION_OPENED,
            description: "Auction is now live. Bidding is open."
        }
    });
}

export async function closeAuctionIfDue(rfqId: string, dbClient?: DbClient): Promise<void> {
    const db = resolveDbClient(dbClient);
    const now = new Date();

    const forceClosed = await db.rFQ.updateMany({
        where: {
            id: rfqId,
            status: AuctionStatus.ACTIVE,
            forcedCloseTime: {
                lte: now
            }
        },
        data: {
            status: AuctionStatus.FORCE_CLOSED
        }
    });

    if (forceClosed.count > 0) {
        await db.activityLog.create({
            data: {
                rfqId,
                activityType: ActivityType.AUCTION_FORCE_CLOSED,
                description: "Auction force closed. Hard deadline reached. No further bids accepted."
            }
        });
        return;
    }

    const naturallyClosed = await db.rFQ.updateMany({
        where: {
            id: rfqId,
            status: AuctionStatus.ACTIVE,
            bidCloseTime: {
                lte: now
            },
            forcedCloseTime: {
                gt: now
            }
        },
        data: {
            status: AuctionStatus.CLOSED
        }
    });

    if (naturallyClosed.count > 0) {
        await db.activityLog.create({
            data: {
                rfqId,
                activityType: ActivityType.AUCTION_CLOSED,
                description: "Auction closed naturally. No further bids accepted."
            }
        });
    }
}
export function isWithinTriggerWindow(bidReceivedAt: Date, rfq: RFQWithConfig): boolean {
    if (!rfq.auctionConfig) {
        return false;
    }

    const windowStart = rfq.bidCloseTime.getTime() - rfq.auctionConfig.triggerWindowMins * 60 * 1000;
    const bidTime = bidReceivedAt.getTime();
    const closeTime = rfq.bidCloseTime.getTime();

    return bidTime >= windowStart && bidTime < closeTime;
}

export function shouldExtend(
    rfq: RFQWithConfig,
    newBidReceivedAt: Date,
    rankingsBefore: RankingEntry[],
    rankingsAfter: RankingEntry[]
): boolean {
    if (!rfq.auctionConfig) {
        return false;
    }

    if (!isWithinTriggerWindow(newBidReceivedAt, rfq)) {
        return false;
    }

    if (rfq.auctionConfig.triggerType === ExtensionTriggerType.BID_RECEIVED) {
        return true;
    }

    if (rfq.auctionConfig.triggerType === ExtensionTriggerType.ANY_RANK_CHANGE) {
        const beforeMap = new Map(rankingsBefore.map((entry) => [entry.supplierId, entry.rank]));

        for (const entry of rankingsAfter) {
            const previousRank = beforeMap.get(entry.supplierId);
            if (previousRank === undefined || previousRank !== entry.rank) {
                return true;
            }
        }

        return false;
    }

    const previousL1 = rankingsBefore.find((entry) => entry.rank === 1)?.supplierId ?? null;
    const currentL1 = rankingsAfter.find((entry) => entry.rank === 1)?.supplierId ?? null;

    return previousL1 !== currentL1;
}

export async function applyExtension(
    rfq: RFQWithConfig,
    triggeringBidId: string,
    triggerType: ExtensionTriggerType,
    txPrisma: Prisma.TransactionClient
): Promise<AuctionExtension | null> {
    if (!rfq.auctionConfig) {
        return null;
    }

    const previousCloseTime = rfq.bidCloseTime;
    const proposedMs =
        rfq.bidCloseTime.getTime() + rfq.auctionConfig.extensionDurationMins * 60 * 1000;
    const newCloseTimeMs = Math.min(proposedMs, rfq.forcedCloseTime.getTime());
    const newCloseTime = new Date(newCloseTimeMs);

    if (newCloseTime.getTime() === rfq.bidCloseTime.getTime()) {
        return null;
    }

    await txPrisma.rFQ.update({
        where: { id: rfq.id },
        data: {
            bidCloseTime: newCloseTime
        }
    });

    const extension = await txPrisma.auctionExtension.create({
        data: {
            rfqId: rfq.id,
            triggeringBidId,
            triggerType,
            previousCloseTime,
            newCloseTime
        }
    });

    let reason = "new bid received";
    if (triggerType === ExtensionTriggerType.ANY_RANK_CHANGE) {
        reason = "supplier ranking changed";
    }
    if (triggerType === ExtensionTriggerType.L1_CHANGE_ONLY) {
        reason = "lowest bidder changed";
    }

    await txPrisma.activityLog.create({
        data: {
            rfqId: rfq.id,
            activityType: ActivityType.AUCTION_EXTENDED,
            extensionId: extension.id,
            description: `Auction extended by ${rfq.auctionConfig.extensionDurationMins} minutes (${reason}).`
        }
    });

    return extension;
}

export async function processBid(
    rfqId: string,
    supplierId: string,
    bidData: Partial<SubmitBidRequestDto>
): Promise<{ bid: Prisma.BidGetPayload<{}>; rankings: RankingEntry[] }> {
    return prisma.$transaction(
        async (tx) => {
            const stepARfq = await tx.rFQ.findUnique({
                where: { id: rfqId },
                include: {
                    auctionConfig: {
                        select: {
                            triggerWindowMins: true,
                            extensionDurationMins: true,
                            triggerType: true
                        }
                    }
                }
            });

            if (!stepARfq) {
                throw new Error("RFQ not found");
            }

            await activateAuctionIfDue(rfqId, tx);
            await closeAuctionIfDue(rfqId, tx);

            const rfq = await tx.rFQ.findUnique({
                where: { id: rfqId },
                include: {
                    auctionConfig: {
                        select: {
                            triggerWindowMins: true,
                            extensionDurationMins: true,
                            triggerType: true
                        }
                    }
                }
            });

            if (!rfq) {
                throw new Error("RFQ not found");
            }

            if (rfq.status !== AuctionStatus.ACTIVE) {
                throw new Error(`Auction is not accepting bids. Status: ${rfq.status}`);
            }

            if (!rfq.auctionConfig) {
                throw new Error("Auction configuration missing for RFQ");
            }

            const receivedAt = new Date();

            if (receivedAt >= rfq.bidCloseTime) {
                throw new Error("Bid received after auction close time. Not accepted.");
            }

            const failures: string[] = [];
            if (typeof bidData.carrierName !== "string" || bidData.carrierName.trim() === "") {
                failures.push("carrierName must be a non-empty string");
            }

            const freightCharges = Number(bidData.freightCharges);
            const originCharges = Number(bidData.originCharges);
            const destinationCharges = Number(bidData.destinationCharges);

            if (!Number.isFinite(freightCharges) || freightCharges < 0) {
                failures.push("freightCharges must be a finite number >= 0");
            }

            if (!Number.isFinite(originCharges) || originCharges < 0) {
                failures.push("originCharges must be a finite number >= 0");
            }

            if (!Number.isFinite(destinationCharges) || destinationCharges < 0) {
                failures.push("destinationCharges must be a finite number >= 0");
            }

            if (!Number.isInteger(bidData.transitTimeDays) || Number(bidData.transitTimeDays) < 1) {
                failures.push("transitTimeDays must be an integer >= 1");
            }

            const quoteValidityDate = bidData.quoteValidityDate
                ? new Date(bidData.quoteValidityDate)
                : null;

            if (!quoteValidityDate || Number.isNaN(quoteValidityDate.getTime())) {
                failures.push("quoteValidityDate must be a valid date");
            } else if (quoteValidityDate <= receivedAt) {
                failures.push("quoteValidityDate must be in the future");
            }

            if (failures.length > 0) {
                throw new Error(`Validation failed: ${failures.join(", ")}`);
            }

            const totalAmount = freightCharges + originCharges + destinationCharges;

            const rankingsBefore = await computeCurrentRankings(rfqId, tx);

            const newBid = await tx.bid.create({
                data: {
                    rfqId,
                    supplierId,
                    carrierName: bidData.carrierName!.trim(),
                    freightCharges,
                    originCharges,
                    destinationCharges,
                    transitTimeDays: Number(bidData.transitTimeDays),
                    quoteValidityDate: quoteValidityDate!,
                    totalAmount,
                    rankAtSubmission: 0,
                    receivedAt
                }
            });

            const rankingsAfter = await computeCurrentRankings(rfqId, tx);

            const newBidRank = rankingsAfter.find((entry) => entry.bidId === newBid.id)?.rank;

            if (!newBidRank) {
                throw new Error("Failed to compute rank for new bid");
            }

            const updatedBid = await tx.bid.update({
                where: { id: newBid.id },
                data: {
                    rankAtSubmission: newBidRank
                }
            });

            const rankingForSupplier = rankingsAfter.find((entry) => entry.supplierId === supplierId);
            const supplierName = rankingForSupplier?.supplierName ?? "Supplier";
            const censoredName = censorName(supplierName);

            const shouldApplyExtension = shouldExtend(rfq as RFQWithConfig, receivedAt, rankingsBefore, rankingsAfter);

            if (shouldApplyExtension) {
                await applyExtension(rfq as RFQWithConfig, newBid.id, rfq.auctionConfig.triggerType, tx);
            }

            await tx.activityLog.create({
                data: {
                    rfqId,
                    bidId: newBid.id,
                    activityType: ActivityType.BID_SUBMITTED,
                    description: `Bid submitted by ${censoredName} — Total: ${formatMoney(totalAmount)}. Rank at submission: L${newBidRank}.`
                }
            });

            if (hasRankChanged(rankingsBefore, rankingsAfter)) {
                const l1 = rankingsAfter.find((entry) => entry.rank === 1);
                if (l1) {
                    await tx.activityLog.create({
                        data: {
                            rfqId,
                            activityType: ActivityType.RANK_CHANGED,
                            description: `Rankings updated. Current L1: ${censorName(l1.supplierName)} at ${formatMoney(l1.totalAmount)}. Total bids: ${rankingsAfter.length}.`
                        }
                    });
                }
            }

            return {
                bid: updatedBid,
                rankings: rankingsAfter
            };
        },
        {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        }
    );
}
