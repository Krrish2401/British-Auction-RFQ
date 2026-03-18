"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "../lib/auth-context";

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (loading) {
            return;
        }

        if (user?.role === "BUYER") {
            router.replace("/buyer/dashboard");
            return;
        }

        if (user?.role === "SUPPLIER") {
            router.replace("/supplier/dashboard");
        }
    }, [loading, user, router]);

    if (loading) {
        return (
            <main className="theme-page-bg flex min-h-screen items-center justify-center">
                <p className="theme-text-muted text-sm font-medium tracking-[0.08em]">Loading...</p>
            </main>
        );
    }

    if (user) {
        return (
            <main className="theme-page-bg flex min-h-screen items-center justify-center">
                <p className="theme-text-muted text-sm font-medium tracking-[0.08em]">Redirecting...</p>
            </main>
        );
    }

    return (
        <main className="theme-page-bg theme-text relative min-h-screen overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
                <div className="theme-hero-orb-a absolute -left-24 top-16 h-72 w-72 rounded-full blur-3xl" />
                <div className="theme-hero-orb-b absolute right-0 top-0 h-80 w-80 rounded-full blur-3xl" />
                <div className="theme-hero-orb-c absolute bottom-0 left-1/3 h-80 w-80 rounded-full blur-3xl" />
                <div className="theme-hero-grid absolute inset-0" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-16 pt-6 sm:px-10">
                <header className="landing-fade-up flex items-center justify-between">
                    <div className="theme-surface theme-border inline-flex items-center gap-3 rounded-full border px-4 py-2 backdrop-blur">
                        <span className="theme-accent-bg h-2 w-2 rounded-full" />
                        <span className="theme-text-muted text-xs font-semibold tracking-[0.14em]">RFQ AUCTIONS</span>
                    </div>
                    <nav className="flex items-center gap-2">
                        <Link
                            href="/login"
                            className="theme-surface theme-border theme-text rounded-full border px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            className="theme-accent-bg rounded-full px-5 py-2 text-sm font-semibold transition"
                        >
                            Get Started
                        </Link>
                    </nav>
                </header>

                <section className="grid flex-1 items-center gap-10 py-10 md:grid-cols-[1.1fr_0.9fr] md:py-14">
                    <div className="landing-fade-up-delay space-y-7">
                        <p className="theme-surface theme-border theme-text-muted inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.12em] backdrop-blur">
                            BRITISH AUCTION WORKFLOW
                        </p>
                        <h1 className="theme-text max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
                            Run fast, fair freight auctions with live rank clarity.
                        </h1>
                        <p className="theme-text-muted max-w-xl text-base leading-relaxed sm:text-lg">
                            Buyers publish RFQs. Suppliers compete in real-time. Automatic extensions keep bidding fair near close. No noisy spreadsheets, no hidden math.
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href="/register"
                                className="theme-accent-bg theme-shadow-accent rounded-full px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
                            >
                                Create Free Account
                            </Link>
                            <Link
                                href="/login"
                                className="theme-surface-strong theme-border theme-text rounded-full border px-6 py-3 text-sm font-semibold transition hover:opacity-90"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>

                    <aside className="theme-surface theme-border theme-shadow-soft landing-fade-up-later rounded-3xl border p-6 backdrop-blur-md sm:p-8">
                        <h2 className="theme-text text-xl font-semibold tracking-tight">Why teams switch to this flow</h2>
                        <ul className="theme-text-muted mt-5 space-y-4 text-sm leading-relaxed sm:text-base">
                            <li className="theme-surface-soft rounded-2xl p-4">
                                <span className="theme-text font-semibold">Live leaderboards:</span> ranking updates are immediate and tie-break by earliest valid bid.
                            </li>
                            <li className="theme-surface-soft rounded-2xl p-4">
                                <span className="theme-text font-semibold">Fair closing:</span> trigger-window extensions prevent last-second sniping.
                            </li>
                            <li className="theme-surface-soft rounded-2xl p-4">
                                <span className="theme-text font-semibold">Role-safe access:</span> buyers and suppliers only see what they should.
                            </li>
                        </ul>
                        <div className="theme-accent-bg mt-6 rounded-2xl p-4 text-sm">
                            <p className="font-semibold">Ready for your next RFQ round?</p>
                            <p className="mt-1">Open an account in under a minute and launch your first auction.</p>
                        </div>
                    </aside>
                </section>
            </div>
        </main>
    );
}
