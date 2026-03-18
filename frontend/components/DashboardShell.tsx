"use client";

import { motion } from "framer-motion";
import { Navbar } from "./Navbar";

export function DashboardShell({
    children,
    title,
    subtitle,
    actions,
}: {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen" style={{ background: "var(--background)" }}>
            <Navbar />

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="hero-orb" style={{ background: "var(--hero-orb-a)", width: 420, height: 420, top: -130, right: -60, animation: "float 20s ease-in-out infinite" }} />
                <div className="hero-orb" style={{ background: "var(--hero-orb-b)", width: 360, height: 360, bottom: -100, left: -80, animation: "float 24s ease-in-out infinite reverse" }} />
                <div className="hero-grid-pattern absolute inset-0 opacity-40" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.42 }}
                    className="mb-8 rounded-2xl border p-6"
                    style={{ borderColor: "var(--border)", background: "var(--surface-strong)", boxShadow: "var(--shadow-soft)" }}
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted-foreground)" }}>
                                Operations Console
                            </p>
                            <h1 className="text-4xl leading-none sm:text-5xl" style={{ fontFamily: "var(--font-heading)", color: "var(--foreground)" }}>
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.48, delay: 0.08 }}
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
}
