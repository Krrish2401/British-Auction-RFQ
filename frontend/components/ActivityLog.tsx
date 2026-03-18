"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Activity } from "lucide-react";

type ActivityLogEntry = {
    id: string;
    occurredAt: string;
    description: string;
};

export function ActivityLog({ logs }: { logs: ActivityLogEntry[] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const displayedLogs = isExpanded ? logs : logs.slice(0, 5);

    return (
        <div className="rounded-xl" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
            <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: logs.length > 0 ? "1px solid var(--border)" : "none" }}>
                <Activity size={16} style={{ color: "var(--accent)" }} />
                <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--foreground)" }}>
                    Activity Log
                </h3>
                <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: "var(--surface-soft)", color: "var(--muted-foreground)" }}
                >
                    {logs.length}
                </span>
            </div>

            {logs.length === 0 ? (
                <div className="px-5 py-6 text-center">
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No activity yet.</p>
                </div>
            ) : (
                <div className="max-h-80 overflow-y-auto">
                    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                        {displayedLogs.map((log) => (
                            <div key={log.id} className="px-5 py-3 transition-colors duration-150"
                                 style={{ borderColor: "var(--border)" }}
                            >
                                <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                                    {new Date(log.occurredAt).toLocaleString()}
                                </p>
                                <p className="mt-0.5 text-sm" style={{ color: "var(--foreground)" }}>{log.description}</p>
                            </div>
                        ))}
                    </div>
                    {logs.length > 5 && (
                        <button
                            type="button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex w-full items-center justify-center gap-1 px-5 py-3 text-xs font-semibold transition-colors"
                            style={{ color: "var(--accent)", borderTop: "1px solid var(--border)" }}
                        >
                            {isExpanded ? (
                                <>Show Less <ChevronUp size={14} /></>
                            ) : (
                                <>Show All ({logs.length}) <ChevronDown size={14} /></>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
