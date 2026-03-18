"use client";

import { Trophy, Medal } from "lucide-react";

type RankingRow = {
    supplierId: string;
    supplierName: string;
    rank: number;
    totalAmount: number;
    freightCharges: number;
    originCharges: number;
    destinationCharges: number;
    transitTimeDays: number;
    quoteValidityDate: string;
};

function RankIcon({ rank }: { rank: number }) {
    if (rank === 1) return <Trophy size={14} style={{ color: "var(--warning)" }} />;
    if (rank === 2) return <Medal size={14} style={{ color: "var(--accent-light)" }} />;
    if (rank === 3) return <Medal size={14} style={{ color: "var(--accent-alt)" }} />;
    return null;
}

export function RankingsTable({
    rankings,
    currentUserId,
    emptyMessage = "No bids were submitted for this auction",
}: {
    rankings: RankingRow[];
    currentUserId: string;
    emptyMessage?: string;
}) {
    if (rankings.length === 0) {
        return (
            <div className="rounded-xl border py-8 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface-strong)", boxShadow: "var(--shadow-soft)" }}>
            <table className="min-w-full text-left text-sm">
                <thead>
                    <tr style={{ background: "var(--surface-soft)", borderBottom: "1px solid var(--border)" }}>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted-foreground)" }}>Rank</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted-foreground)" }}>Supplier</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted-foreground)" }}>Total</th>
                        <th className="hidden px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] md:table-cell" style={{ color: "var(--muted-foreground)" }}>Freight</th>
                        <th className="hidden px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] md:table-cell" style={{ color: "var(--muted-foreground)" }}>Origin</th>
                        <th className="hidden px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] md:table-cell" style={{ color: "var(--muted-foreground)" }}>Destination</th>
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted-foreground)" }}>Transit</th>
                        <th className="hidden px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] lg:table-cell" style={{ color: "var(--muted-foreground)" }}>Validity</th>
                    </tr>
                </thead>
                <tbody>
                    {rankings.map((row) => {
                        const isCurrentUser = row.supplierId === currentUserId;
                        return (
                            <tr
                                key={`${row.supplierId}-${row.rank}`}
                                style={{
                                    borderBottom: "1px solid var(--border)",
                                    background: isCurrentUser ? "var(--accent-glow)" : "transparent",
                                }}
                            >
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: "var(--foreground)" }}>
                                        <RankIcon rank={row.rank} />
                                        L{row.rank}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>
                                    {row.supplierName}
                                    {isCurrentUser && (
                                        <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "linear-gradient(130deg, var(--accent), var(--accent-alt))", color: "var(--accent-contrast)" }}>
                                            You
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                                    ${row.totalAmount.toFixed(2)}
                                </td>
                                <td className="hidden px-4 py-3 text-sm md:table-cell" style={{ color: "var(--muted-foreground)" }}>${row.freightCharges.toFixed(2)}</td>
                                <td className="hidden px-4 py-3 text-sm md:table-cell" style={{ color: "var(--muted-foreground)" }}>${row.originCharges.toFixed(2)}</td>
                                <td className="hidden px-4 py-3 text-sm md:table-cell" style={{ color: "var(--muted-foreground)" }}>${row.destinationCharges.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{row.transitTimeDays}d</td>
                                <td className="hidden px-4 py-3 text-sm lg:table-cell" style={{ color: "var(--muted-foreground)" }}>
                                    {new Date(row.quoteValidityDate).toLocaleDateString()}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
