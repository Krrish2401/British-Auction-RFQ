import type { RFQStatus } from "../lib/api";

const statusConfig: Record<RFQStatus, { label: string; bg: string; text: string; dot: string }> = {
    DRAFT: {
        label: "Upcoming",
        bg: "var(--surface-soft)",
        text: "var(--muted-foreground)",
        dot: "var(--muted-foreground)",
    },
    ACTIVE: {
        label: "Live",
        bg: "var(--success-soft)",
        text: "var(--success)",
        dot: "var(--success)",
    },
    CLOSED: {
        label: "Closed",
        bg: "var(--warning-soft)",
        text: "var(--warning)",
        dot: "var(--warning)",
    },
    FORCE_CLOSED: {
        label: "Force Closed",
        bg: "var(--danger-soft)",
        text: "var(--danger)",
        dot: "var(--danger)",
    },
};

export function StatusBadge({ status }: { status: RFQStatus }) {
    const config = statusConfig[status];

    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: config.bg, color: config.text }}
        >
            <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                    background: config.dot,
                    animation: status === "ACTIVE" ? "pulse-glow 2s ease-in-out infinite" : "none",
                }}
            />
            {config.label}
        </span>
    );
}
