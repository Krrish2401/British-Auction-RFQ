"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock3, Settings, CalendarDays, RefreshCw, AlertTriangle, Layers3 } from "lucide-react";

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
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
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

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-5xl leading-none" style={{ fontFamily: "var(--font-heading)" }}>{rfq.name}</h1>
                            <StatusBadge status={rfq.status} />
                        </div>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted-foreground)" }}>{rfq.referenceId}</p>
                    </div>
                    <CountdownTimer targetTime={new Date(rfq.bidCloseTime)} getNowMs={getServerNowMs} onExpired={() => void fetchRFQ()} />
                </motion.div>

                <div className="mb-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="cinema-panel">
                        <div className="relative h-[290px] sm:h-[350px]">
                            <Image src="/images/control-room.svg" alt="RFQ board" fill className="object-cover" />
                            <div className="absolute inset-0" style={{ background: "linear-gradient(130deg, rgba(6,10,22,0.52), rgba(6,10,22,0.18), rgba(6,10,22,0.66))" }} />
                            <div className="absolute bottom-4 left-4 right-4 rounded-xl border p-3" style={{ borderColor: "rgba(166,190,255,0.35)", background: "rgba(9,16,32,0.6)" }}>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Auction Snapshot</p>
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                    <div className="rounded-lg border p-2 text-center" style={{ borderColor: "rgba(166,190,255,0.25)", background: "rgba(16,30,62,0.62)" }}>
                                        <p className="text-[11px] text-slate-300">Bids</p>
                                        <p className="text-xl text-slate-100" style={{ fontFamily: "var(--font-heading)" }}>{rfq.bids.length}</p>
                                    </div>
                                    <div className="rounded-lg border p-2 text-center" style={{ borderColor: "rgba(166,190,255,0.25)", background: "rgba(16,30,62,0.62)" }}>
                                        <p className="text-[11px] text-slate-300">Suppliers</p>
                                        <p className="text-xl text-slate-100" style={{ fontFamily: "var(--font-heading)" }}>{rfq.rankings.length}</p>
                                    </div>
                                    <div className="rounded-lg border p-2 text-center" style={{ borderColor: "rgba(166,190,255,0.25)", background: "rgba(16,30,62,0.62)" }}>
                                        <p className="text-[11px] text-slate-300">Extensions</p>
                                        <p className="text-xl text-slate-100" style={{ fontFamily: "var(--font-heading)" }}>{rfq.extensions.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="theme-card p-4">
                            <div className="mb-2 flex items-center gap-2">
                                <Clock3 size={15} style={{ color: "var(--accent)" }} />
                                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted-foreground)" }}>Timing</p>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between gap-3"><span style={{ color: "var(--muted-foreground)" }}>Original</span><span style={{ color: "var(--foreground)" }}>{new Date(rfq.originalBidCloseTime).toLocaleString()}</span></div>
                                <div className="flex justify-between gap-3"><span style={{ color: "var(--muted-foreground)" }}>Current</span><span style={{ color: "var(--foreground)" }}>{new Date(rfq.bidCloseTime).toLocaleString()}</span></div>
                                <div className="flex justify-between gap-3"><span style={{ color: "var(--muted-foreground)" }}>Forced</span><span style={{ color: "var(--foreground)" }}>{new Date(rfq.forcedCloseTime).toLocaleString()}</span></div>
                            </div>
                        </div>

                        <div className="theme-card p-4">
                            <div className="mb-2 flex items-center gap-2">
                                <CalendarDays size={15} style={{ color: "var(--accent)" }} />
                                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted-foreground)" }}>Pickup Date</p>
                            </div>
                            <p className="text-sm" style={{ color: "var(--foreground)" }}>
                                {new Date(rfq.pickupDate).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                            </p>
                        </div>

                        {rfq.auctionConfig && (
                            <div className="theme-card p-4 sm:col-span-2">
                                <div className="mb-2 flex items-center gap-2">
                                    <Settings size={15} style={{ color: "var(--accent)" }} />
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted-foreground)" }}>Auction Config</p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3 text-sm">
                                    <div><p style={{ color: "var(--muted-foreground)" }}>Trigger Type</p><p style={{ color: "var(--foreground)" }}>{rfq.auctionConfig.triggerType.replace(/_/g, " ")}</p></div>
                                    <div><p style={{ color: "var(--muted-foreground)" }}>Trigger Window</p><p style={{ color: "var(--foreground)" }}>{rfq.auctionConfig.triggerWindowMins} min</p></div>
                                    <div><p style={{ color: "var(--muted-foreground)" }}>Extension</p><p style={{ color: "var(--foreground)" }}>{rfq.auctionConfig.extensionDurationMins} min</p></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                            <div className="mb-2 flex items-center gap-2">
                                <Layers3 size={15} style={{ color: "var(--accent)" }} />
                                <h2 className="text-4xl leading-none" style={{ fontFamily: "var(--font-heading)" }}>Current Rankings</h2>
                            </div>
                            <RankingsTable rankings={rankingRows} currentUserId={user.id} />
                        </motion.div>

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
                    </div>

                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <ActivityLog logs={rfq.activityLogs.map((log) => ({ id: log.id, occurredAt: log.occurredAt, description: log.description }))} />
                        <div className="mt-4 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted-foreground)" }}>
                            <p className="mb-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--accent)" }}>
                                <RefreshCw size={12} />
                                Extensions Recorded
                            </p>
                            <p>{rfq.extensions.length} extension events logged for this auction.</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
