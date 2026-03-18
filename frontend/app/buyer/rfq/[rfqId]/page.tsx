"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ActivityLog } from "../../../../components/ActivityLog";
import { CountdownTimer } from "../../../../components/CountdownTimer";
import { RankingsTable } from "../../../../components/RankingsTable";
import { StatusBadge } from "../../../../components/StatusBadge";
import { getRFQ, type RFQDetails } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";
import { useRequireAuth } from "../../../../lib/use-require-auth";

function buildRankingRows(rfq: RFQDetails) {
    return rfq.rankings
        .map((ranking) => {
            const bid = rfq.bids.find((entry) => entry.id === ranking.bidId);
            if (!bid) {
                return null;
            }

            return {
                supplierId: ranking.supplierId,
                supplierName: ranking.supplierName,
                rank: ranking.rank,
                totalAmount: Number(ranking.totalAmount),
                freightCharges: Number(bid.freightCharges),
                originCharges: Number(bid.originCharges),
                destinationCharges: Number(bid.destinationCharges),
                transitTimeDays: bid.transitTimeDays,
                quoteValidityDate: bid.quoteValidityDate
            };
        })
        .filter((entry): entry is NonNullable<typeof entry> => !!entry);
}

export default function BuyerRFQDetailPage() {
    const params = useParams<{ rfqId: string }>();
    const rfqId = params?.rfqId;
    const router = useRouter();
    const { user, loading } = useRequireAuth("BUYER");
    const { logout } = useAuth();
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
        if (!rfqId) {
            return;
        }

        try {
            const data = await getRFQ(rfqId);
            setRfq(data);
            setError("");

            if (data.status === "CLOSED" || data.status === "FORCE_CLOSED") {
                stopPolling();
            }
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : "Failed to load RFQ");
        } finally {
            setIsFetching(false);
        }
    }, [rfqId, stopPolling]);

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    useEffect(() => {
        if (loading || !user || user.role !== "BUYER" || !rfqId) {
            return;
        }

        void fetchRFQ();

        pollRef.current = setInterval(() => {
            void fetchRFQ();
        }, 10000);

        return () => {
            stopPolling();
        };
    }, [loading, user, rfqId, fetchRFQ, stopPolling]);

    const rankingRows = useMemo(() => (rfq ? buildRankingRows(rfq) : []), [rfq]);

    if (loading || !user || user.role !== "BUYER") {
        return <main className="p-6">Loading...</main>;
    }

    if (isFetching) {
        return <main className="p-6">Loading RFQ...</main>;
    }

    if (error) {
        return <main className="p-6 text-red-600">{error}</main>;
    }

    if (!rfq) {
        return <main className="p-6">RFQ not found.</main>;
    }

    return (
        <main className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-6xl space-y-4 rounded-lg bg-white p-6 shadow">
                <button type="button" onClick={() => router.push("/buyer/dashboard")} className="text-sm text-blue-700">
                    Back to dashboard
                </button>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
                    >
                        Logout
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">{rfq.name}</h1>
                        <p className="text-sm text-slate-600">{rfq.referenceId}</p>
                    </div>
                    <StatusBadge status={rfq.status} />
                </div>

                <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                    <p>Original Bid Close Time: {new Date(rfq.originalBidCloseTime).toLocaleString()}</p>
                    <p>Current Bid Close Time: {new Date(rfq.bidCloseTime).toLocaleString()}</p>
                    <p>Forced Close Time: {new Date(rfq.forcedCloseTime).toLocaleString()}</p>
                    <p>Extended {rfq.extensions.length} times</p>
                </div>

                {rfq.auctionConfig ? (
                    <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                        <p>Trigger Type: {rfq.auctionConfig.triggerType}</p>
                        <p>Trigger Window (X): {rfq.auctionConfig.triggerWindowMins} mins</p>
                        <p>Extension Duration (Y): {rfq.auctionConfig.extensionDurationMins} mins</p>
                    </div>
                ) : null}

                <CountdownTimer
                    targetTime={new Date(rfq.bidCloseTime)}
                    onExpired={() => {
                        stopPolling();
                        void fetchRFQ();
                    }}
                />

                <RankingsTable
                    rankings={rankingRows}
                    currentUserId={user.id}
                    emptyMessage="No bids were submitted for this auction"
                />

                {rfq.status === "CLOSED" ? (
                    <div className="rounded-md bg-amber-100 p-3 text-amber-900">This auction has closed.</div>
                ) : null}
                {rfq.status === "FORCE_CLOSED" ? (
                    <div className="rounded-md bg-rose-100 p-3 text-rose-900">This auction was force closed.</div>
                ) : null}

                <ActivityLog logs={rfq.activityLogs.map((log) => ({ id: log.id, occurredAt: log.occurredAt, description: log.description }))} />
            </div>
        </main>
    );
}
