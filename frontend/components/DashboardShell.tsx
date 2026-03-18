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
        <div className="min-h-screen" style={{ background: "var(--background)" }}>
            <Navbar />

            <div className="mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
                {/* Page header */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl"
                            style={{ fontFamily: "var(--font-heading)", color: "var(--foreground)" }}
                        >
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>{subtitle}</p>
                        )}
                    </div>
                    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
}
