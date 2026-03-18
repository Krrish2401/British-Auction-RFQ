"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck, TrendingDown, Sparkles } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 28 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
    }),
};

const stagger: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
};

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-90px" });

    return (
        <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger} className={className}>
            {children}
        </motion.div>
    );
}

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (loading) return;
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
            <main className="flex min-h-screen items-center justify-center" style={{ background: "var(--background)" }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-2" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
                    <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted-foreground)" }}>
                        Loading
                    </p>
                </div>
            </main>
        );
    }

    if (user) {
        return (
            <main className="flex min-h-screen items-center justify-center" style={{ background: "var(--background)" }}>
                <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted-foreground)" }}>
                    Redirecting...
                </p>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen overflow-hidden" style={{ background: "var(--background)", color: "var(--foreground)" }}>
            <Navbar />

            <section className="relative flex min-h-screen items-center pt-20">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="hero-orb" style={{ background: "var(--hero-orb-a)", width: 600, height: 600, top: -260, left: -180, animation: "float 24s ease-in-out infinite" }} />
                    <div className="hero-orb" style={{ background: "var(--hero-orb-b)", width: 520, height: 520, right: -150, top: 70, animation: "float 26s ease-in-out infinite reverse" }} />
                    <div className="hero-grid-pattern absolute inset-0 opacity-45" />
                </div>

                <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
                    <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
                                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                            >
                                <Sparkles size={14} style={{ color: "var(--accent-alt)" }} />
                                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted-foreground)" }}>
                                    Quote Arena Platform
                                </span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="text-6xl leading-[0.9] sm:text-7xl lg:text-8xl"
                                style={{ fontFamily: "var(--font-heading)", color: "var(--foreground)" }}
                            >
                                Bids Drop.
                                <br />
                                <span style={{ color: "var(--accent)" }}>Clarity Rises.</span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55, delay: 0.22 }}
                                className="mt-5 max-w-xl text-base leading-relaxed sm:text-lg"
                                style={{ color: "var(--muted-foreground)" }}
                            >
                                Launch RFQs, gather bids in real time, and close with confidence. Designed for transparent procurement with extension rules that keep the auction fair until the final second.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55, delay: 0.28 }}
                                className="mt-8 flex flex-wrap items-center gap-4"
                            >
                                <Link href="/register" className="theme-btn-primary" style={{ padding: "0.92rem 1.95rem" }}>
                                    Create Free Account
                                    <ArrowRight size={16} />
                                </Link>
                                <Link href="/login" className="theme-btn-secondary" style={{ padding: "0.92rem 1.95rem" }}>
                                    Sign In
                                </Link>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, x: 28 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7, delay: 0.25 }}
                            className="cinema-panel"
                        >
                            <div className="relative h-120 sm:h-135">
                                <Image src="/images/hero-rfq-network.svg" alt="RFQ network visualization" fill className="object-cover" priority />
                                <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(6,10,22,0.7), rgba(6,10,22,0.25) 45%, rgba(6,10,22,0.65))" }} />

                                <div className="absolute left-5 right-5 top-5 rounded-xl border p-3" style={{ borderColor: "rgba(160,185,255,0.35)", background: "rgba(6, 12, 28, 0.62)" }}>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">Live RFQ Snapshot</p>
                                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                                        <div className="rounded-lg border p-2" style={{ borderColor: "rgba(160,185,255,0.25)", background: "rgba(20,36,72,0.62)" }}>
                                            <p className="text-xs text-slate-300">Active RFQs</p>
                                            <p className="text-lg font-bold text-slate-100">12</p>
                                        </div>
                                        <div className="rounded-lg border p-2" style={{ borderColor: "rgba(160,185,255,0.25)", background: "rgba(20,36,72,0.62)" }}>
                                            <p className="text-xs text-slate-300">Suppliers</p>
                                            <p className="text-lg font-bold text-slate-100">48</p>
                                        </div>
                                        <div className="rounded-lg border p-2" style={{ borderColor: "rgba(160,185,255,0.25)", background: "rgba(20,36,72,0.62)" }}>
                                            <p className="text-xs text-slate-300">Avg Savings</p>
                                            <p className="text-lg font-bold text-emerald-300">14.2%</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute bottom-5 left-5 right-5 grid gap-2 sm:grid-cols-2">
                                    {[
                                        "Rankings update instantly",
                                        "Auto-extension logic active",
                                        "Audit trail for every event",
                                        "Role-safe supplier visibility",
                                    ].map((item) => (
                                        <div key={item} className="rounded-lg border px-3 py-2 text-xs font-semibold" style={{ borderColor: "rgba(160,185,255,0.25)", background: "rgba(8,15,32,0.62)", color: "#dbe6ff" }}>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <section className="relative border-y py-16" style={{ borderColor: "var(--border)" }}>
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <AnimatedSection className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {[
                            { value: "100%", label: "Traceable events" },
                            { value: "10s", label: "Live refresh cadence" },
                            { value: "Fair", label: "Extension outcomes" },
                            { value: "Secure", label: "Role access model" },
                        ].map((stat, i) => (
                            <motion.div key={stat.label} variants={fadeUp} custom={i} className="rounded-xl border p-4 text-center" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                                <p className="text-4xl leading-none" style={{ fontFamily: "var(--font-heading)", color: "var(--accent)" }}>
                                    {stat.value}
                                </p>
                                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted-foreground)" }}>
                                    {stat.label}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatedSection>
                </div>
            </section>

            <section className="relative py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <AnimatedSection className="mb-12 text-center">
                        <motion.p variants={fadeUp} custom={0} className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
                            Why Teams Switch
                        </motion.p>
                        <motion.h2 variants={fadeUp} custom={1} className="mt-2 text-5xl leading-none sm:text-6xl" style={{ fontFamily: "var(--font-heading)" }}>
                            Procurement Without Blind Spots
                        </motion.h2>
                    </AnimatedSection>

                    <AnimatedSection className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                icon: TrendingDown,
                                title: "Reverse Bidding",
                                description: "Suppliers keep improving offers while rankings stay objective and visible.",
                            },
                            {
                                icon: Clock3,
                                title: "Smart Extensions",
                                description: "Trigger windows prevent last-second sniping and preserve fairness.",
                            },
                            {
                                icon: ShieldCheck,
                                title: "Role-Safe Views",
                                description: "Buyers and suppliers get only the data required for their workflow.",
                            },
                            {
                                icon: CheckCircle2,
                                title: "Action History",
                                description: "Every bid and extension is logged for audit and post-round review.",
                            },
                        ].map((feature, i) => (
                            <motion.div key={feature.title} variants={fadeUp} custom={i} className="theme-card p-5">
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--accent-glow)" }}>
                                    <feature.icon size={19} style={{ color: "var(--accent)" }} />
                                </div>
                                <h3 className="text-2xl leading-none" style={{ fontFamily: "var(--font-heading)" }}>
                                    {feature.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatedSection>
                </div>
            </section>

            <section className="relative py-20" style={{ background: "var(--background-secondary)", borderTop: "1px solid var(--border)" }}>
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid items-center gap-8 rounded-2xl border p-6 lg:grid-cols-[1.2fr_0.8fr]" style={{ borderColor: "var(--border)", background: "var(--surface-strong)", boxShadow: "var(--shadow-soft)" }}>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted-foreground)" }}>
                                Launch In Minutes
                            </p>
                            <h3 className="mt-2 text-5xl leading-none" style={{ fontFamily: "var(--font-heading)" }}>
                                Ready For Your Next RFQ Round?
                            </h3>
                            <p className="mt-3 max-w-xl text-sm" style={{ color: "var(--muted-foreground)" }}>
                                Create an account, open a live quote round, and monitor rankings from a single command-style workspace.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <Link href="/register" className="theme-btn-primary">
                                    Start Free
                                </Link>
                                <Link href="/login" className="theme-btn-secondary">
                                    Sign In
                                </Link>
                            </div>
                        </div>

                        <div className="cinema-panel">
                            <Image src="/images/control-room.svg" alt="Quote Arena dashboard illustration" width={1100} height={760} className="h-full w-full object-cover" />
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
