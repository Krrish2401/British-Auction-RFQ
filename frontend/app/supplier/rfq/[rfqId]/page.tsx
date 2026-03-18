"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ActivityLog } from "../../../../components/ActivityLog";
import { BidForm } from "../../../../components/BidForm";
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

export default function SupplierRFQDetailPage() {
    const params = useParams<{ rfqId: string }>();
    const rfqId = params?.rfqId;
    const router = useRouter();
    const { user, loading } = useRequireAuth("SUPPLIER");
    const { logout } = useAuth();
    const [rfq, setRfq] = useState<RFQDetails | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");
    const [isBidWindowExpired, setIsBidWindowExpired] = useState(false);
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
            setIsBidWindowExpired(new Date(data.bidCloseTime).getTime() <= Date.now());

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
        if (loading || !user || user.role !== "SUPPLIER" || !rfqId) {
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

    if (loading || !user || user.role !== "SUPPLIER") {
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
        <main className="theme-page-bg theme-text min-h-screen p-6">
            <div className="theme-surface theme-shadow-soft mx-auto max-w-6xl space-y-4 rounded-lg p-6">
                <button type="button" onClick={() => router.push("/supplier/dashboard")} className="theme-accent-hover text-sm font-medium">
                    Back to dashboard
                </button>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="theme-accent-bg rounded-md px-4 py-2 text-sm font-semibold"
                    >
                        Logout
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="theme-text text-2xl font-semibold">{rfq.name}</h1>
                        <p className="theme-text-muted text-sm">{rfq.referenceId}</p>
                    </div>
                    <StatusBadge status={rfq.status} />
                </div>

                <div className="theme-text-muted grid gap-2 text-sm md:grid-cols-2">
                    <p>Current Bid Close Time: {new Date(rfq.bidCloseTime).toLocaleString()}</p>
                    <p>Forced Close Time: {new Date(rfq.forcedCloseTime).toLocaleString()}</p>
                </div>

                {rfq.auctionConfig ? (
                    <div className="theme-surface-soft theme-border theme-text-muted rounded-lg border p-3 text-sm">
                        <p>Trigger Type: {rfq.auctionConfig.triggerType}</p>
                        <p>Trigger Window (X): {rfq.auctionConfig.triggerWindowMins} mins</p>
                        <p>Extension Duration (Y): {rfq.auctionConfig.extensionDurationMins} mins</p>
                    </div>
                ) : null}

                <CountdownTimer
                    targetTime={new Date(rfq.bidCloseTime)}
                    onExpired={() => {
                        setIsBidWindowExpired(true);
                        stopPolling();
                        void fetchRFQ();
                    }}
                />

                <RankingsTable
                    rankings={rankingRows}
                    currentUserId={user.id}
                    emptyMessage="No bids were submitted for this auction"
                />

                {rfq.status === "ACTIVE" ? (
                    <BidForm
                        rfqId={rfq.id}
                        onBidSubmitted={() => void fetchRFQ()}
                        disabled={isBidWindowExpired}
                    />
                ) : null}
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
