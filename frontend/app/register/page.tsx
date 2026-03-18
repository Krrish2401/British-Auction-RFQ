"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, ArrowRight, Building2, Truck, BadgeCheck } from "lucide-react";
import { registerUser } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { Navbar } from "../../components/Navbar";

export default function RegisterPage() {
    const router = useRouter();
    const { setAuthenticatedUser } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"BUYER" | "SUPPLIER">("BUYER");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const user = await registerUser({ name, email, password, role });
            setAuthenticatedUser(user);

            if (user.role === "BUYER") {
                router.replace("/buyer/dashboard");
                return;
            }

            router.replace("/supplier/dashboard");
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Registration failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="relative min-h-screen overflow-hidden px-4 pb-10 pt-20" style={{ background: "var(--background)" }}>
            <Navbar />

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="hero-orb" style={{ background: "var(--hero-orb-a)", width: 560, height: 560, top: -200, left: -120, animation: "float 24s ease-in-out infinite" }} />
                <div className="hero-orb" style={{ background: "var(--hero-orb-b)", width: 420, height: 420, bottom: -120, right: -110, animation: "float 21s ease-in-out infinite reverse" }} />
                <div className="hero-grid-pattern absolute inset-0 opacity-35" />
            </div>

            <div className="relative mx-auto mt-6 grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="theme-card p-7 sm:p-8"
                    style={{ boxShadow: "var(--shadow-soft)" }}
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted-foreground)" }}>
                        Create Account
                    </p>
                    <h1 className="mt-1 text-6xl leading-none" style={{ fontFamily: "var(--font-heading)", color: "var(--foreground)" }}>
                        Join Quote Arena
                    </h1>
                    <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                        Pick your role and start transparent bidding in minutes.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div>
                            <label className="theme-label" htmlFor="name">Full Name</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="theme-input"
                                    style={{ paddingLeft: "2.5rem" }}
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="theme-label" htmlFor="email">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
                                <input
                                    id="email"
                                    type="email"
                                    required
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="theme-input"
                                    style={{ paddingLeft: "2.5rem" }}
                                    placeholder="Min. 8 characters"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="theme-label">Account Role</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole("BUYER")}
                                    className="rounded-xl border p-3 text-left transition-all"
                                    style={{
                                        borderColor: role === "BUYER" ? "var(--accent)" : "var(--border)",
                                        background: role === "BUYER" ? "var(--accent-glow)" : "var(--surface-soft)",
                                    }}
                                >
                                    <div className="mb-1 flex items-center gap-2">
                                        <Building2 size={16} style={{ color: role === "BUYER" ? "var(--accent)" : "var(--muted-foreground)" }} />
                                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Buyer</p>
                                    </div>
                                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Create RFQs and evaluate bids</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole("SUPPLIER")}
                                    className="rounded-xl border p-3 text-left transition-all"
                                    style={{
                                        borderColor: role === "SUPPLIER" ? "var(--accent)" : "var(--border)",
                                        background: role === "SUPPLIER" ? "var(--accent-glow)" : "var(--surface-soft)",
                                    }}
                                >
                                    <div className="mb-1 flex items-center gap-2">
                                        <Truck size={16} style={{ color: role === "SUPPLIER" ? "var(--accent)" : "var(--muted-foreground)" }} />
                                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Supplier</p>
                                    </div>
                                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Compete with live rank visibility</p>
                                </button>
                            </div>
                        </div>

                        {error && <p className="theme-error text-center">{error}</p>}

                        <button type="submit" disabled={isSubmitting} className="theme-btn-primary w-full" style={{ padding: "0.9rem" }}>
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} />
                                    Creating account...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Create Account
                                    <ArrowRight size={16} />
                                </span>
                            )}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                            Sign in
                        </Link>
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.1 }}
                    className="cinema-panel hidden lg:block"
                >
                    <div className="relative h-full min-h-[620px]">
                        <Image src="/images/control-room.svg" alt="Control room visualization" fill className="object-cover" priority />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(130deg, rgba(6,10,22,0.68), rgba(6,10,22,0.2), rgba(6,10,22,0.72))" }} />

                        <div className="absolute left-6 right-6 top-6 rounded-xl border p-4" style={{ borderColor: "rgba(166,190,255,0.3)", background: "rgba(8,14,30,0.58)" }}>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Get Started Fast</p>
                            <h2 className="text-5xl leading-none text-slate-100" style={{ fontFamily: "var(--font-heading)" }}>
                                Build Better
                                <br />
                                Sourcing Rounds
                            </h2>
                        </div>

                        <div className="absolute bottom-6 left-6 right-6 space-y-2">
                            {[
                                "Create your first RFQ in minutes",
                                "Invite suppliers and track rank shifts live",
                                "Close with full activity history",
                            ].map((line) => (
                                <div key={line} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-100" style={{ borderColor: "rgba(166,190,255,0.26)", background: "rgba(8,14,30,0.58)" }}>
                                    <BadgeCheck size={15} style={{ color: "#2de2cf" }} />
                                    {line}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
