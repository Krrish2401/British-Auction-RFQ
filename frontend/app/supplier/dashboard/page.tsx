"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { listRFQs, type RFQSummary } from "../../../lib/api";
import { StatusBadge } from "../../../components/StatusBadge";
import { useAuth } from "../../../lib/auth-context";
import { useRequireAuth } from "../../../lib/use-require-auth";

function formatCurrency(value: number | null): string {
    if (value === null) {
        return "—";
    }

    return `$${value.toFixed(2)}`;
}

export default function SupplierDashboardPage() {
    const router = useRouter();
    const { loading, user } = useRequireAuth("SUPPLIER");
    const { logout } = useAuth();
    const [rfqs, setRfqs] = useState<RFQSummary[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (loading || !user || user.role !== "SUPPLIER") {
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

    if (loading || !user || user.role !== "SUPPLIER") {
        return <main className="p-6">Loading...</main>;
    }

    return (
        <main className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-6xl rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-slate-900">Supplier Dashboard</h1>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-md bg-slate-900 px-4 py-2 text-white"
                    >
                        Logout
                    </button>
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
                                        onClick={() => router.push(`/supplier/rfq/${rfq.id}`)}
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
                        {rfqs.length === 0 ? <p className="py-6 text-slate-600">No active RFQs right now.</p> : null}
                    </div>
                )}
            </div>
        </main>
    );
}
