"use client";

import { useEffect, useRef, useState } from "react";

function formatTime(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
}

export function CountdownTimer({
    targetTime,
    onExpired
}: {
    targetTime: Date;
    onExpired: () => void;
}) {
    const [timeLeft, setTimeLeft] = useState(targetTime.getTime() - Date.now());
    const hasExpiredRef = useRef(false);

    useEffect(() => {
        hasExpiredRef.current = false;
        setTimeLeft(targetTime.getTime() - Date.now());

        const timer = setInterval(() => {
            const remaining = targetTime.getTime() - Date.now();
            setTimeLeft(remaining);

            if (remaining <= 0 && !hasExpiredRef.current) {
                hasExpiredRef.current = true;
                onExpired();
            }
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, [targetTime, onExpired]);

    if (timeLeft <= 0) {
        return <p className="text-sm font-semibold text-red-600">Auction Closed</p>;
    }

    return <p className="text-sm font-semibold text-slate-900">Time Left: {formatTime(timeLeft)}</p>;
}
