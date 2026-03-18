"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Settings, CalendarDays, RefreshCw, AlertTriangle } from "lucide-react";

import { ActivityLog } from "../../../../components/ActivityLog";
import { CountdownTimer } from "../../../../components/CountdownTimer";
import { RankingsTable } from "../../../../components/RankingsTable";
import { StatusBadge } from "../../../../components/StatusBadge";
import { Navbar } from "../../../../components/Navbar";
import { getRFQ, getServerNowMs, type RFQDetails } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";
import { useRequireAuth } from "../../../../lib/use-require-auth";

function buildRankingRows(rfq: RFQDetails) {
    return rfq.rankings
        .map((ranking) => {
            const bid = rfq.bids.find((entry) => entry.id === ranking.bidId);
            if (!bid) return null;
            return {
                supplierId: ranking.supplierId,
                supplierName: ranking.supplierName,
                rank: ranking.rank,
                totalAmount: Number(ranking.totalAmount),
                freightCharges: Number(bid.freightCharges),
                originCharges: Number(bid.originCharges),
                destinationCharges: Number(bid.destinationCharges),
                transitTimeDays: bid.transitTimeDays,
                quoteValidityDate: bid.quoteValidityDate,
            };
        })
        .filter((entry): entry is NonNullable<typeof entry> => !!entry);
}

export default function BuyerRFQDetailPage() {
    const params = useParams<{ rfqId: string }>();
    const rfqId = params?.rfqId;
    const router = useRouter();
    const { user, loading } = useRequireAuth("BUYER");
    useAuth();
    const [rfq, setRfq] = useState<RFQDetails | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    const stopPolling = useCallback(() => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }, []);

    const fetchRFQ = useCallback(async () => {
        if (!rfqId) return;
        try {
            const data = await getRFQ(rfqId);
            setRfq(data);
            setError("");
            if (data.status === "CLOSED" || data.status === "FORCE_CLOSED") stopPolling();
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : "Failed to load RFQ");
        } finally {
            setIsFetching(false);
        }
    }, [rfqId, stopPolling]);

    useEffect(() => {
        if (loading || !user || user.role !== "BUYER" || !rfqId) return;
        void fetchRFQ();
        pollRef.current = setInterval(() => void fetchRFQ(), 10000);
        return () => stopPolling();
    }, [loading, user, rfqId, fetchRFQ, stopPolling]);

    const rankingRows = useMemo(() => (rfq ? buildRankingRows(rfq) : []), [rfq]);

    if (loading || !user || user.role !== "BUYER") {
        return (
            <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--background)" }}>
                <div className="h-10 w-10 animate-spin rounded-full border-2" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
            </div>
        );
    }

    if (isFetching) {
        return (
            <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--background)" }}>
                <div className="h-10 w-10 animate-spin rounded-full border-2" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen" style={{ background: "var(--background)" }}>
                <Navbar />
                <div className="flex items-center justify-center pt-32">
                    <div className="theme-card p-8 text-center">
                        <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: "var(--danger)" }} />
                        <p className="theme-error">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!rfq) {
        return (
            <div className="min-h-screen" style={{ background: "var(--background)" }}>
                <Navbar />
                <div className="flex items-center justify-center pt-32">
                    <p style={{ color: "var(--muted-foreground)" }}>RFQ not found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: "var(--background)" }}>
            <Navbar />

            <div className="mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
                {/* Back */}
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    type="button"
                    onClick={() => router.push("/buyer/dashboard")}
                    className="theme-btn-ghost mb-6 flex items-center gap-1.5 text-sm"
                >
                    <ArrowLeft size={14} />
                    Back to Dashboard
                </motion.button>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
                >
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>{rfq.name}</h1>
                            <StatusBadge status={rfq.status} />
                        </div>
                        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>{rfq.referenceId}</p>
                    </div>
                    <CountdownTimer
                        targetTime={new Date(rfq.bidCloseTime)}
                        getNowMs={getServerNowMs}
                        onExpired={() => void fetchRFQ()}
                    />
                </motion.div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main column */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Rankings */}
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <h2 className="mb-3 text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>Current Rankings</h2>
                            <RankingsTable rankings={rankingRows} currentUserId={user.id} />
                        </motion.div>

                        {/* Status alerts */}
                        {rfq.status === "CLOSED" && (
                            <div className="flex items-center gap-2 rounded-xl p-4" style={{ background: "var(--warning-soft)", border: "1px solid var(--border)" }}>
                                <AlertTriangle size={16} style={{ color: "var(--warning)" }} />
                                <p className="text-sm font-medium" style={{ color: "var(--warning)" }}>This auction has closed.</p>
                            </div>
                        )}
                        {rfq.status === "FORCE_CLOSED" && (
                            <div className="flex items-center gap-2 rounded-xl p-4" style={{ background: "var(--danger-soft)", border: "1px solid var(--border)" }}>
                                <AlertTriangle size={16} style={{ color: "var(--danger)" }} />
                                <p className="text-sm font-medium" style={{ color: "var(--danger)" }}>This auction was force closed.</p>
                            </div>
                        )}

                        {/* Activity */}
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <ActivityLog logs={rfq.activityLogs.map((log) => ({ id: log.id, occurredAt: log.occurredAt, description: log.description }))} />
                        </motion.div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Timing info */}
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                            <div className="theme-card p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock size={16} style={{ color: "var(--accent)" }} />
                                    <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)" }}>Timing</h3>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span style={{ color: "var(--muted-foreground)" }}>Original Close</span>
                                        <span style={{ color: "var(--foreground)" }}>{new Date(rfq.originalBidCloseTime).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: "var(--muted-foreground)" }}>Current Close</span>
                                        <span style={{ color: "var(--foreground)" }}>{new Date(rfq.bidCloseTime).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: "var(--muted-foreground)" }}>Forced Close</span>
                                        <span style={{ color: "var(--foreground)" }}>{new Date(rfq.forcedCloseTime).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                                        <span style={{ color: "var(--muted-foreground)" }}>Extensions</span>
                                        <span className="inline-flex items-center gap-1 font-semibold" style={{ color: "var(--accent)" }}>
                                            <RefreshCw size={12} /> {rfq.extensions.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Pickup date */}
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <div className="theme-card p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <CalendarDays size={16} style={{ color: "var(--accent)" }} />
                                    <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)" }}>Pickup Date</h3>
                                </div>
                                <p className="text-sm" style={{ color: "var(--foreground)" }}>
                                    {new Date(rfq.pickupDate).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                </p>
                            </div>
                        </motion.div>

                        {/* Auction config */}
                        {rfq.auctionConfig && (
                            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                                <div className="theme-card p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Settings size={16} style={{ color: "var(--accent)" }} />
                                        <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)" }}>Auction Config</h3>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span style={{ color: "var(--muted-foreground)" }}>Trigger Type</span>
                                            <span className="font-medium" style={{ color: "var(--foreground)" }}>{rfq.auctionConfig.triggerType.replace(/_/g, " ")}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span style={{ color: "var(--muted-foreground)" }}>Trigger Window</span>
                                            <span style={{ color: "var(--foreground)" }}>{rfq.auctionConfig.triggerWindowMins} min</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span style={{ color: "var(--muted-foreground)" }}>Extension Duration</span>
                                            <span style={{ color: "var(--foreground)" }}>{rfq.auctionConfig.extensionDurationMins} min</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
