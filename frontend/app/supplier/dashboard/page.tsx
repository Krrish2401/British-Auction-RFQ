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
        <main className="theme-page-bg theme-text min-h-screen p-6">
            <div className="theme-surface theme-shadow-soft mx-auto max-w-6xl rounded-lg p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="theme-text text-2xl font-semibold">Supplier Dashboard</h1>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="theme-accent-bg rounded-md px-4 py-2 font-semibold"
                    >
                        Logout
                    </button>
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
                        {rfqs.length === 0 ? <p className="theme-text-muted py-6">No active RFQs right now.</p> : null}
                    </div>
                )}
            </div>
        </main>
    );
}
