import type { RFQStatus } from "../lib/api";

export function StatusBadge({ status }: { status: RFQStatus }) {
    if (status === "DRAFT") {
        return <span className="theme-surface-soft rounded-full px-2 py-1 text-xs font-medium">Upcoming</span>;
    }

    if (status === "ACTIVE") {
        return <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-900">Live</span>;
    }

    if (status === "FORCE_CLOSED") {
        return <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-900">Force Closed</span>;
    }

    return <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">Closed</span>;
}
