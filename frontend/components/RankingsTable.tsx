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

export function RankingsTable({
    rankings,
    currentUserId,
    emptyMessage = "No bids were submitted for this auction"
}: {
    rankings: RankingRow[];
    currentUserId: string;
    emptyMessage?: string;
}) {
    if (rankings.length === 0) {
        return <p className="text-sm text-slate-600">{emptyMessage}</p>;
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                        <th className="px-3 py-2">Rank</th>
                        <th className="px-3 py-2">Supplier</th>
                        <th className="px-3 py-2">Total Amount</th>
                        <th className="px-3 py-2">Freight</th>
                        <th className="px-3 py-2">Origin</th>
                        <th className="px-3 py-2">Destination</th>
                        <th className="px-3 py-2">Transit Days</th>
                        <th className="px-3 py-2">Quote Validity</th>
                    </tr>
                </thead>
                <tbody>
                    {rankings.map((row) => (
                        <tr
                            key={`${row.supplierId}-${row.rank}`}
                            className={`border-b border-slate-100 ${
                                row.supplierId === currentUserId ? "bg-blue-50" : "bg-white"
                            }`}
                        >
                            <td className="px-3 py-2">L{row.rank}</td>
                            <td className="px-3 py-2">{row.supplierName}</td>
                            <td className="px-3 py-2">${row.totalAmount.toFixed(2)}</td>
                            <td className="px-3 py-2">${row.freightCharges.toFixed(2)}</td>
                            <td className="px-3 py-2">${row.originCharges.toFixed(2)}</td>
                            <td className="px-3 py-2">${row.destinationCharges.toFixed(2)}</td>
                            <td className="px-3 py-2">{row.transitTimeDays}</td>
                            <td className="px-3 py-2">{new Date(row.quoteValidityDate).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
