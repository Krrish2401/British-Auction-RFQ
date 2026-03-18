"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { listRFQs, type RFQSummary } from "../../../lib/api";
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
    if (status === "DRAFT") {
        return "bg-slate-200 text-slate-800";
    }

    if (status === "ACTIVE") {
        return "bg-emerald-100 text-emerald-800";
    }

    if (status === "FORCE_CLOSED") {
        return "bg-rose-100 text-rose-800";
    }

    return "bg-amber-100 text-amber-800";
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
        <main className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-6xl rounded-lg bg-white p-6 shadow">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-slate-900">Buyer Dashboard</h1>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => router.push("/buyer/rfq/create")}
                            className="rounded-md bg-blue-700 px-4 py-2 text-white"
                        >
                            Create New RFQ
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-md bg-slate-900 px-4 py-2 text-white"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

                {isFetching ? (
                    <p className="text-slate-600">Loading RFQs...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-700">
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
                                        className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                                        onClick={() => router.push(`/buyer/rfq/${rfq.id}`)}
                                    >
                                        <td className="px-3 py-3">{rfq.name}</td>
                                        <td className="px-3 py-3">{rfq.referenceId}</td>
                                        <td className="px-3 py-3">{formatCurrency(rfq.currentLowestBid)}</td>
                                        <td className="px-3 py-3">{new Date(rfq.bidCloseTime).toLocaleString()}</td>
                                        <td className="px-3 py-3">{new Date(rfq.forcedCloseTime).toLocaleString()}</td>
                                        <td className="px-3 py-3">
                                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(rfq.status)}`}>
                                                {statusLabel(rfq.status)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">{rfq.totalBidCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {rfqs.length === 0 ? <p className="py-6 text-slate-600">No RFQs created yet.</p> : null}
                    </div>
                )}
            </div>
        </main>
    );
}
