"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

function splitTime(ms: number): { hours: string; minutes: string; seconds: string } {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    return {
        hours: String(Math.floor(totalSeconds / 3600)).padStart(2, "0"),
        minutes: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0"),
        seconds: String(totalSeconds % 60).padStart(2, "0"),
    };
}

export function CountdownTimer({
    targetTime,
    onExpired,
    getNowMs = () => Date.now(),
}: {
    targetTime: Date;
    onExpired: () => void;
    getNowMs?: () => number;
}) {
    const [timeLeft, setTimeLeft] = useState(() => targetTime.getTime() - getNowMs());
    const hasExpiredRef = useRef(false);

    useEffect(() => {
        hasExpiredRef.current = false;

        const updateTimeLeft = () => {
            const remaining = targetTime.getTime() - getNowMs();
            setTimeLeft(remaining);

            if (remaining <= 0 && !hasExpiredRef.current) {
                hasExpiredRef.current = true;
                onExpired();
            }
        };

        const initialTimer = setTimeout(updateTimeLeft, 0);
        const timer = setInterval(updateTimeLeft, 1000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(timer);
        };
    }, [targetTime, onExpired, getNowMs]);

    if (timeLeft <= 0) {
        return (
            <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ background: "var(--danger-soft)" }}>
                <Clock size={16} style={{ color: "var(--danger)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--danger)" }}>Auction Closed</span>
            </div>
        );
    }

    const { hours, minutes, seconds } = splitTime(timeLeft);
    const isUrgent = timeLeft < 300000; // less than 5 min

    return (
        <div className="inline-flex items-center gap-3 rounded-xl px-4 py-2.5"
             style={{ background: isUrgent ? "var(--danger-soft)" : "var(--surface-soft)", border: "1px solid var(--border)" }}
        >
            <Clock size={16} style={{ color: isUrgent ? "var(--danger)" : "var(--accent)" }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                Time Left
            </span>
            <div className="flex items-center gap-1">
                {[hours, minutes, seconds].map((val, i) => (
                    <span key={i} className="flex items-center gap-1">
                        <span className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-1.5 text-sm font-bold tabular-nums"
                              style={{
                                  background: isUrgent ? "var(--danger)" : "var(--accent)",
                                  color: "var(--accent-contrast)",
                              }}
                        >
                            {val}
                        </span>
                        {i < 2 && <span className="text-sm font-bold" style={{ color: "var(--muted-foreground)" }}>:</span>}
                    </span>
                ))}
            </div>
        </div>
    );
}
