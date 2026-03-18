"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Zap, Shield, Clock, TrendingDown, Users, BarChart3, ArrowRight, CheckCircle2 } from "lucide-react";

import { useAuth } from "../lib/auth-context";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    }),
};

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
};

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });
    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className={className}
        >
            {children}
        </motion.div>
    );
}

const features = [
    {
        icon: TrendingDown,
        title: "Reverse Auction Engine",
        description: "Suppliers compete to offer the best price. Automatic ranking updates with every bid submission.",
    },
    {
        icon: Clock,
        title: "Smart Extensions",
        description: "Configurable trigger windows prevent last-second sniping. Fair closing for every participant.",
    },
    {
        icon: Shield,
        title: "Role-Based Access",
        description: "Buyers and suppliers only see what they should. Censored supplier names maintain competitive integrity.",
    },
    {
        icon: Zap,
        title: "Real-Time Rankings",
        description: "Live leaderboards with immediate ranking updates. Tie-break by earliest valid bid timestamp.",
    },
    {
        icon: Users,
        title: "Multi-Supplier Support",
        description: "Unlimited suppliers can compete on each RFQ. Each supplier can submit multiple bids to improve their rank.",
    },
    {
        icon: BarChart3,
        title: "Full Audit Trail",
        description: "Complete activity logs, extension history, and bid records. Full transparency at every step.",
    },
];

const stats = [
    { value: "100%", label: "Transparent" },
    { value: "Real-time", label: "Rankings" },
    { value: "Fair", label: "Extensions" },
    { value: "Secure", label: "Role-based" },
];

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (loading) return;
        if (user?.role === "BUYER") { router.replace("/buyer/dashboard"); return; }
        if (user?.role === "SUPPLIER") { router.replace("/supplier/dashboard"); }
    }, [loading, user, router]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center" style={{ background: "var(--background)" }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-2" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
                    <p className="text-sm font-medium tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>Loading</p>
                </div>
            </main>
        );
    }

    if (user) {
        return (
            <main className="flex min-h-screen items-center justify-center" style={{ background: "var(--background)" }}>
                <p className="text-sm font-medium tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>Redirecting...</p>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen overflow-hidden" style={{ background: "var(--background)", color: "var(--foreground)" }}>
            <Navbar />

            {/* ── HERO ── */}
            <section className="relative flex min-h-screen items-center pt-20">
                {/* Background orbs */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="hero-orb" style={{ background: "var(--hero-orb-a)", width: "600px", height: "600px", top: "-200px", left: "-200px", animation: "float 20s ease-in-out infinite" }} />
                    <div className="hero-orb" style={{ background: "var(--hero-orb-b)", width: "500px", height: "500px", top: "100px", right: "-150px", animation: "float 25s ease-in-out infinite reverse" }} />
                    <div className="hero-orb" style={{ background: "var(--hero-orb-c)", width: "400px", height: "400px", bottom: "-100px", left: "30%", animation: "float 22s ease-in-out infinite 3s" }} />
                    <div className="hero-grid-pattern absolute inset-0 opacity-50" />
                </div>

                <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
                    <div className="grid items-center gap-16 lg:grid-cols-2">
                        {/* Left: Copy */}
                        <div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
                                style={{ background: "var(--surface)", border: "1px solid var(--border)", backdropFilter: "blur(8px)" }}
                            >
                                <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)", animation: "pulse-glow 2s ease-in-out infinite" }} />
                                <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>
                                    Reverse Auction Platform
                                </span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.3 }}
                                className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
                                style={{ fontFamily: "var(--font-heading)" }}
                            >
                                Competitive{" "}
                                <span style={{ color: "var(--accent)" }}>Bidding,</span>
                                <br />
                                Transparent Results
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="mb-8 max-w-lg text-base leading-relaxed sm:text-lg"
                                style={{ color: "var(--muted-foreground)" }}
                            >
                                Buyers publish RFQs. Suppliers compete in real-time. Automatic extensions keep bidding fair near close.
                                No noisy spreadsheets, no hidden math.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                                className="flex flex-wrap items-center gap-4"
                            >
                                <Link
                                    href="/register"
                                    className="theme-btn-primary flex items-center gap-2"
                                    style={{ padding: "0.875rem 2rem", fontSize: "0.9rem", borderRadius: "0.875rem" }}
                                >
                                    Create Free Account
                                    <ArrowRight size={16} />
                                </Link>
                                <Link
                                    href="/login"
                                    className="theme-btn-secondary"
                                    style={{ padding: "0.875rem 2rem", fontSize: "0.9rem", borderRadius: "0.875rem" }}
                                >
                                    Sign In
                                </Link>
                            </motion.div>
                        </div>

                        {/* Right: Feature cards */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="relative"
                        >
                            <div className="theme-card p-8"
                                 style={{ boxShadow: "var(--shadow-soft)" }}
                            >
                                <h2 className="mb-6 text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                                    Why teams switch to this flow
                                </h2>
                                <div className="space-y-4">
                                    {[
                                        { title: "Live leaderboards", desc: "Ranking updates are immediate and tie-break by earliest valid bid." },
                                        { title: "Fair closing", desc: "Trigger-window extensions prevent last-second sniping." },
                                        { title: "Role-safe access", desc: "Buyers and suppliers only see what they should." },
                                    ].map((item, i) => (
                                        <motion.div
                                            key={item.title}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                                            className="flex items-start gap-3 rounded-xl p-4"
                                            style={{ background: "var(--surface-soft)" }}
                                        >
                                            <CheckCircle2 size={18} style={{ color: "var(--accent)", marginTop: "2px", flexShrink: 0 }} />
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{item.title}</p>
                                                <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>{item.desc}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="mt-6 rounded-xl p-4" style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>
                                    <p className="text-sm font-semibold">Ready for your next RFQ round?</p>
                                    <p className="mt-1 text-sm opacity-90">Open an account in under a minute and launch your first auction.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── STATS STRIP ── */}
            <section className="relative py-16" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <AnimatedSection className="grid grid-cols-2 gap-8 md:grid-cols-4">
                        {stats.map((stat, i) => (
                            <motion.div key={stat.label} variants={fadeUp} custom={i} className="text-center">
                                <p className="text-3xl font-bold md:text-4xl" style={{ fontFamily: "var(--font-heading)", color: "var(--accent)" }}>
                                    {stat.value}
                                </p>
                                <p className="mt-1 text-sm font-medium uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                                    {stat.label}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatedSection>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section className="relative py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <AnimatedSection className="mb-16 text-center">
                        <motion.p variants={fadeUp} custom={0} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                            Platform Features
                        </motion.p>
                        <motion.h2 variants={fadeUp} custom={1} className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
                            Everything you need for fair procurement
                        </motion.h2>
                        <motion.p variants={fadeUp} custom={2} className="mx-auto mt-4 max-w-2xl text-base" style={{ color: "var(--muted-foreground)" }}>
                            A purpose-built platform for transparent reverse auctions with real-time competitive bidding.
                        </motion.p>
                    </AnimatedSection>

                    <AnimatedSection className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                variants={fadeUp}
                                custom={i}
                                className="theme-card group cursor-default p-6"
                            >
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                                     style={{ background: "var(--accent-glow)" }}
                                >
                                    <feature.icon size={20} style={{ color: "var(--accent)" }} />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{feature.title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{feature.description}</p>
                            </motion.div>
                        ))}
                    </AnimatedSection>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="relative py-24" style={{ background: "var(--background-secondary)" }}>
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <AnimatedSection className="mb-16 text-center">
                        <motion.p variants={fadeUp} custom={0} className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                            How It Works
                        </motion.p>
                        <motion.h2 variants={fadeUp} custom={1} className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
                            Three steps to transparent procurement
                        </motion.h2>
                    </AnimatedSection>

                    <AnimatedSection className="grid gap-8 md:grid-cols-3">
                        {[
                            { step: "01", title: "Create RFQ", desc: "Buyers define requirements, set auction timing, and configure extension rules. The auction engine handles the rest." },
                            { step: "02", title: "Suppliers Compete", desc: "Suppliers submit bids in real-time. Rankings update instantly. Fair extension windows prevent last-second sniping." },
                            { step: "03", title: "Award & Review", desc: "Full audit trail of bids, rankings, and extensions. Complete transparency for every participant." },
                        ].map((item, i) => (
                            <motion.div key={item.step} variants={fadeUp} custom={i} className="relative">
                                <div className="theme-card p-8">
                                    <span className="text-5xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--accent)", opacity: 0.3 }}>
                                        {item.step}
                                    </span>
                                    <h3 className="mt-4 text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{item.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatedSection>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="relative py-24">
                <div className="pointer-events-none absolute inset-0">
                    <div className="hero-orb" style={{ background: "var(--hero-orb-a)", width: "400px", height: "400px", top: "-100px", right: "10%", animation: "float 18s ease-in-out infinite" }} />
                </div>
                <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
                    <AnimatedSection>
                        <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
                            If it exists,{" "}
                            <span style={{ color: "var(--accent)" }}>we&apos;ll find the best price.</span>
                        </motion.h2>
                        <motion.p variants={fadeUp} custom={1} className="mx-auto mt-6 max-w-xl text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                            Our platform connects buyers with competing suppliers in real-time. Fair, transparent, and efficient procurement starts here.
                        </motion.p>
                        <motion.div variants={fadeUp} custom={2} className="mt-8 flex flex-wrap items-center justify-center gap-4">
                            <Link
                                href="/register"
                                className="theme-btn-primary flex items-center gap-2"
                                style={{ padding: "1rem 2.5rem", fontSize: "0.95rem", borderRadius: "0.875rem" }}
                            >
                                Start Now
                                <ArrowRight size={16} />
                            </Link>
                            <Link href="/login" className="theme-btn-secondary" style={{ padding: "1rem 2.5rem", fontSize: "0.95rem", borderRadius: "0.875rem" }}>
                                Sign In
                            </Link>
                        </motion.div>
                    </AnimatedSection>
                </div>
            </section>

            <Footer />
        </main>
    );
}
