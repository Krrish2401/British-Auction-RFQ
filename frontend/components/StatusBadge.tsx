import type { RFQStatus } from "../lib/api";

export function StatusBadge({ status }: { status: RFQStatus }) {
    if (status === "DRAFT") {
        return <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-800">Upcoming</span>;
    }

    if (status === "ACTIVE") {
        return <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">Live</span>;
    }

    if (status === "FORCE_CLOSED") {
        return <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-800">Force Closed</span>;
    }

    return <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">Closed</span>;
}
