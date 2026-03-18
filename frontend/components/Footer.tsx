"use client";

import Link from "next/link";
import { Zap, Shield, Clock } from "lucide-react";

export function Footer() {
    return (
        <footer style={{ background: "var(--background-secondary)", borderTop: "1px solid var(--border)" }}>
            <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                <div className="grid gap-12 md:grid-cols-4">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--accent)" }}>
                                <span className="text-sm font-bold" style={{ color: "var(--accent-contrast)" }}>R</span>
                            </div>
                            <span className="text-base font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--foreground)" }}>
                                RFQ AUCTION
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                            The premier reverse-auction platform for transparent, fair procurement.
                        </p>
                    </div>

                    {/* Features */}
                    <div>
                        <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
                            Features
                        </h4>
                        <ul className="space-y-2.5">
                            {[
                                { icon: Zap, text: "Real-time Bidding" },
                                { icon: Shield, text: "Fair Extensions" },
                                { icon: Clock, text: "Live Countdown" },
                            ].map((item) => (
                                <li key={item.text} className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                                    <item.icon size={14} style={{ color: "var(--accent)" }} />
                                    {item.text}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
                            Quick Links
                        </h4>
                        <ul className="space-y-2.5">
                            {[
                                { label: "Sign In", href: "/login" },
                                { label: "Register", href: "/register" },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm transition-colors duration-200 hover:underline"
                                        style={{ color: "var(--muted-foreground)" }}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)" }}>
                            Legal
                        </h4>
                        <ul className="space-y-2.5">
                            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                                <li key={item}>
                                    <span className="text-sm cursor-pointer transition-colors duration-200 hover:underline" style={{ color: "var(--muted-foreground)" }}>
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row"
                     style={{ borderTop: "1px solid var(--border)" }}
                >
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        © 2026 RFQ Auction. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                            Built for transparent procurement
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
