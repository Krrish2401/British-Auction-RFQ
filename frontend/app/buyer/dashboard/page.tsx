"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowRight, TrendingDown, Clock3, FileText, Activity, Filter, Sparkles } from "lucide-react";

import { listRFQs, type RFQSummary } from "../../../lib/api";
import { StatusBadge } from "../../../components/StatusBadge";
import { useAuth } from "../../../lib/auth-context";
import { useRequireAuth } from "../../../lib/use-require-auth";
import { DashboardShell } from "../../../components/DashboardShell";

function formatCurrency(value: number | null): string {
    if (value === null) return "—";
    return `$${value.toFixed(2)}`;
}

export default function BuyerDashboardPage() {
    const router = useRouter();
    const { loading, user } = useRequireAuth("BUYER");
    useAuth();
    const [rfqs, setRfqs] = useState<RFQSummary[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (loading || !user || user.role !== "BUYER") return;

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

    if (loading || !user || user.role !== "BUYER") {
        return (
            <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--background)" }}>
                <div className="h-10 w-10 animate-spin rounded-full border-2" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
            </div>
        );
    }

    const activeCount = rfqs.filter((r) => r.status === "ACTIVE").length;
    const totalBids = rfqs.reduce((acc, r) => acc + r.totalBidCount, 0);

    return (
        <DashboardShell
            title="Buyer Listings"
            subtitle={`Welcome back, ${user.name}`}
            actions={
                <button onClick={() => router.push("/buyer/rfq/create")} className="theme-btn-primary">
                    <Plus size={16} />
                    Create RFQ
                </button>
            }
        >
            {error && <p className="theme-error mb-4">{error}</p>}

            <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { icon: FileText, label: "Total RFQs", value: rfqs.length, color: "var(--accent)" },
                    { icon: Activity, label: "Active", value: activeCount, color: "var(--success)" },
                    { icon: TrendingDown, label: "Total Bids", value: totalBids, color: "var(--accent-alt)" },
                    { icon: Clock3, label: "Closed", value: rfqs.filter((r) => r.status === "CLOSED" || r.status === "FORCE_CLOSED").length, color: "var(--warning)" },
                ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="theme-card p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--accent-glow)" }}>
                                <stat.icon size={18} style={{ color: stat.color }} />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted-foreground)" }}>{stat.label}</p>
                                <p className="text-3xl leading-none" style={{ fontFamily: "var(--font-heading)", color: "var(--foreground)" }}>{stat.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.26fr_0.74fr]">
                <aside className="space-y-4">
                    <div className="theme-card p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <Filter size={15} style={{ color: "var(--accent)" }} />
                            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted-foreground)" }}>
                                View Helpers
                            </p>
                        </div>
                        <div className="space-y-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                            <p>Use status tags to spot active RFQs quickly.</p>
                            <p>Open any card to review rankings and activity logs.</p>
                            <p>Close times are shown in your local timezone.</p>
                        </div>
                    </div>

                    <div className="cinema-panel">
                        <Image src="/images/freight-terminal.svg" alt="Freight terminal" width={1200} height={760} className="h-full w-full object-cover" />
                    </div>
                </aside>

                <section>
                    {isFetching ? (
                        <div className="flex items-center justify-center rounded-xl border py-16" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}>
                            <div className="h-8 w-8 animate-spin rounded-full border-2" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
                        </div>
                    ) : rfqs.length === 0 ? (
                        <div className="theme-card py-16 text-center">
                            <FileText size={40} className="mx-auto mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.5 }} />
                            <p className="text-4xl leading-none" style={{ fontFamily: "var(--font-heading)" }}>No RFQs Yet</p>
                            <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>Create your first RFQ to get started.</p>
                            <button onClick={() => router.push("/buyer/rfq/create")} className="theme-btn-primary mt-6">
                                <Plus size={16} /> Create RFQ
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rfqs.map((rfq, i) => (
                                <motion.div
                                    key={rfq.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.12 + i * 0.03 }}
                                    onClick={() => router.push(`/buyer/rfq/${rfq.id}`)}
                                    className="group cursor-pointer rounded-xl border p-5 transition-all"
                                    style={{ borderColor: "var(--border)", background: "var(--surface-strong)", boxShadow: "var(--shadow-soft)" }}
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-center gap-3">
                                                <h3 className="truncate text-4xl leading-none" style={{ fontFamily: "var(--font-heading)", color: "var(--foreground)" }}>
                                                    {rfq.name}
                                                </h3>
                                                <StatusBadge status={rfq.status} />
                                            </div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted-foreground)" }}>
                                                {rfq.referenceId}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-5 text-sm">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted-foreground)" }}>Lowest Bid</p>
                                                <p className="text-xl leading-none" style={{ color: rfq.currentLowestBid ? "var(--accent)" : "var(--muted-foreground)", fontFamily: "var(--font-heading)" }}>
                                                    {formatCurrency(rfq.currentLowestBid)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted-foreground)" }}>Close Time</p>
                                                <p style={{ color: "var(--foreground)" }}>{new Date(rfq.bidCloseTime).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted-foreground)" }}>Bids</p>
                                                <p className="text-xl leading-none" style={{ color: "var(--foreground)", fontFamily: "var(--font-heading)" }}>{rfq.totalBidCount}</p>
                                            </div>
                                            <ArrowRight size={16} className="hidden transition-transform group-hover:translate-x-1 sm:block" style={{ color: "var(--accent)" }} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <div className="mt-8 rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted-foreground)" }}>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
                    <Sparkles size={14} />
                    Tip
                </p>
                <p className="mt-1 text-sm">Create short, clear RFQ names so suppliers can identify rounds instantly in their dashboard listing.</p>
            </div>
        </DashboardShell>
    );
}
