"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, ShieldCheck, Clock3, LineChart } from "lucide-react";

import { loginUser } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { Navbar } from "../../components/Navbar";

export default function LoginPage() {
    const router = useRouter();
    const { setAuthenticatedUser } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const user = await loginUser({ email, password });
            setAuthenticatedUser(user);

            if (user.role === "BUYER") {
                router.replace("/buyer/dashboard");
                return;
            }

            router.replace("/supplier/dashboard");
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Login failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="relative min-h-screen overflow-hidden px-4 pb-10 pt-20" style={{ background: "var(--background)" }}>
            <Navbar />

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="hero-orb" style={{ background: "var(--hero-orb-a)", width: 520, height: 520, top: -170, right: -120, animation: "float 24s ease-in-out infinite" }} />
                <div className="hero-orb" style={{ background: "var(--hero-orb-b)", width: 420, height: 420, bottom: -130, left: -100, animation: "float 22s ease-in-out infinite reverse" }} />
                <div className="hero-grid-pattern absolute inset-0 opacity-35" />
            </div>

            <div className="relative mx-auto mt-6 grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="cinema-panel hidden lg:block"
                >
                    <div className="relative h-full min-h-[620px]">
                        <Image src="/images/freight-terminal.svg" alt="Freight terminal scene" fill className="object-cover" priority />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(130deg, rgba(6,10,22,0.66), rgba(6,10,22,0.22), rgba(6,10,22,0.72))" }} />

                        <div className="absolute left-6 right-6 top-6 rounded-xl border p-4" style={{ borderColor: "rgba(166,190,255,0.3)", background: "rgba(8,14,30,0.58)" }}>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Welcome Back</p>
                            <h2 className="text-5xl leading-none text-slate-100" style={{ fontFamily: "var(--font-heading)" }}>
                                Command Your
                                <br />
                                Auction Floor
                            </h2>
                        </div>

                        <div className="absolute bottom-6 left-6 right-6 grid gap-3">
                            {[
                                { icon: LineChart, text: "Live ranking visibility" },
                                { icon: Clock3, text: "Server-synced countdowns" },
                                { icon: ShieldCheck, text: "Role-based secure access" },
                            ].map((item) => (
                                <div key={item.text} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-100" style={{ borderColor: "rgba(166,190,255,0.26)", background: "rgba(8,14,30,0.58)" }}>
                                    <item.icon size={15} style={{ color: "#7aa7ff" }} />
                                    {item.text}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.1 }}
                    className="theme-card p-7 sm:p-8"
                    style={{ boxShadow: "var(--shadow-soft)" }}
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted-foreground)" }}>
                        Account Access
                    </p>
                    <h1 className="mt-1 text-6xl leading-none" style={{ fontFamily: "var(--font-heading)", color: "var(--foreground)" }}>
                        Sign In
                    </h1>
                    <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                        Continue where your last bidding round ended.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                        <div>
                            <label className="theme-label" htmlFor="email">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    disabled={isSubmitting}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="theme-input"
                                    style={{ paddingLeft: "2.5rem" }}
                                    placeholder="you@company.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="theme-label" htmlFor="password">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    disabled={isSubmitting}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="theme-input"
                                    style={{ paddingLeft: "2.5rem" }}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && <p className="theme-error text-center">{error}</p>}

                        <button type="submit" disabled={isSubmitting} className="theme-btn-primary w-full" style={{ padding: "0.9rem" }}>
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} />
                                    Signing in...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Sign In
                                    <ArrowRight size={16} />
                                </span>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                        New here?{" "}
                        <Link href="/register" className="font-semibold transition-colors hover:underline" style={{ color: "var(--accent)" }}>
                            Create an account
                        </Link>
                    </p>
                </motion.div>
            </div>
        </main>
    );
}
