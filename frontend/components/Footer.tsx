"use client";

import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, TimerReset, LineChart } from "lucide-react";

export function Footer() {
    return (
        <footer style={{ borderTop: "1px solid var(--border)", background: "var(--background-secondary)" }}>
            <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                <div className="grid gap-12 md:grid-cols-4">
                    <div className="md:col-span-1">
                        <div className="mb-4 flex items-center gap-2.5">
                            <Image src="/logo.png" alt="Quote Arena logo" width={32} height={32} className="h-8 w-8 object-contain" />
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--muted-foreground)" }}>
                                    Quote Arena
                                </p>
                                <p className="text-base" style={{ fontFamily: "var(--font-heading)", lineHeight: "0.9", color: "var(--foreground)" }}>
                                    Procurement Platform
                                </p>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                            Built for transparent sourcing where suppliers compete in real time and buyers close with confidence.
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted-foreground)" }}>
                            Core Capabilities
                        </h4>
                        <ul className="space-y-2.5">
                            {[
                                { icon: LineChart, text: "Live ranking board" },
                                { icon: TimerReset, text: "Auto extension logic" },
                                { icon: ShieldCheck, text: "Role-safe visibility" },
                            ].map((item) => (
                                <li key={item.text} className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                                    <item.icon size={14} style={{ color: "var(--accent)" }} />
                                    {item.text}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted-foreground)" }}>
                            Entry Points
                        </h4>
                        <ul className="space-y-2.5">
                            {[
                                { label: "Sign In", href: "/login" },
                                { label: "Create Account", href: "/register" },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm transition-colors hover:underline" style={{ color: "var(--muted-foreground)" }}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted-foreground)" }}>
                            Platform Notes
                        </h4>
                        <ul className="space-y-2.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
                            <li>Bid history is immutable</li>
                            <li>Server-time synchronized countdowns</li>
                            <li>Transparent extension activity log</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row" style={{ borderColor: "var(--border)" }}>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        © 2026 Quote Arena. All rights reserved.
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        Procurement clarity by design
                    </p>
                </div>
            </div>
        </footer>
    );
}
