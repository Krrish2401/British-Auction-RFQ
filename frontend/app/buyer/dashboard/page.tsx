"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { listRFQs, type RFQSummary } from "../../../lib/api";
import { StatusBadge } from "../../../components/StatusBadge";
import { useAuth } from "../../../lib/auth-context";
import { useRequireAuth } from "../../../lib/use-require-auth";

function statusLabel(status: RFQSummary["status"]): string {
    if (status === "DRAFT") {
        return "Upcoming";
    }

    if (status === "ACTIVE") {
        return "Live";
    }

    if (status === "FORCE_CLOSED") {
        return "Force Closed";
    }

    return "Closed";
}

function statusClass(status: RFQSummary["status"]): string {
    // StatusBadge component now handles all status styling
    return "";
}

function formatCurrency(value: number | null): string {
    if (value === null) {
        return "—";
    }

    return `$${value.toFixed(2)}`;
}

export default function BuyerDashboardPage() {
    const router = useRouter();
    const { loading, user } = useRequireAuth("BUYER");
    const { logout } = useAuth();
    const [rfqs, setRfqs] = useState<RFQSummary[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (loading || !user || user.role !== "BUYER") {
            return;
        }

        const load = async () => {
            setIsFetching(true);
            setError("");

            try {
                const data = await listRFQs();
                setRfqs(data);
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : "Failed to load RFQs");
            } finally {
                setIsFetching(false);
            }
        };

        void load();
    }, [loading, user]);

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    if (loading || !user || user.role !== "BUYER") {
        return <main className="p-6">Loading...</main>;
    }

    return (
        <main className="theme-page-bg theme-text min-h-screen p-6">
            <div className="theme-surface theme-shadow-soft mx-auto max-w-6xl rounded-lg p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="theme-text text-2xl font-semibold">Buyer Dashboard</h1>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => router.push("/buyer/rfq/create")}
                            className="theme-accent-bg rounded-md px-4 py-2 font-semibold"
                        >
                            Create New RFQ
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="theme-accent-bg rounded-md px-4 py-2 font-semibold"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

                {isFetching ? (
                    <p className="theme-text-muted">Loading RFQs...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="theme-border theme-text-muted border-b">
                                    <th className="px-3 py-2">RFQ Name</th>
                                    <th className="px-3 py-2">Reference ID</th>
                                    <th className="px-3 py-2">Current Lowest Bid</th>
                                    <th className="px-3 py-2">Current Bid Close Time</th>
                                    <th className="px-3 py-2">Forced Close Time</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2">Total Bids</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rfqs.map((rfq) => (
                                    <tr
                                        key={rfq.id}
                                        className="theme-border cursor-pointer border-b hover:opacity-75"
                                        onClick={() => router.push(`/buyer/rfq/${rfq.id}`)}
                                    >
                                        <td className="px-3 py-3">{rfq.name}</td>
                                        <td className="px-3 py-3">{rfq.referenceId}</td>
                                        <td className="px-3 py-3">{formatCurrency(rfq.currentLowestBid)}</td>
                                        <td className="px-3 py-3">{new Date(rfq.bidCloseTime).toLocaleString()}</td>
                                        <td className="px-3 py-3">{new Date(rfq.forcedCloseTime).toLocaleString()}</td>
                                        <td className="px-3 py-3">
                                            <StatusBadge status={rfq.status} />
                                        </td>
                                        <td className="px-3 py-3">{rfq.totalBidCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {rfqs.length === 0 ? <p className="theme-text-muted py-6">No RFQs created yet.</p> : null}
                    </div>
                )}
            </div>
        </main>
    );
}
