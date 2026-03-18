"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";

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
        <main className="relative flex min-h-screen items-center justify-center px-4" style={{ background: "var(--background)" }}>
            <Navbar />

            {/* Background orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="hero-orb" style={{ background: "var(--hero-orb-a)", width: "500px", height: "500px", top: "-200px", right: "-100px", animation: "float 20s ease-in-out infinite" }} />
                <div className="hero-orb" style={{ background: "var(--hero-orb-b)", width: "400px", height: "400px", bottom: "-100px", left: "-100px", animation: "float 25s ease-in-out infinite reverse" }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative w-full max-w-md"
            >
                <div className="theme-card p-8" style={{ boxShadow: "var(--shadow-soft)" }}>
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                            Welcome Back
                        </h1>
                        <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                            Sign in to your RFQ Auction account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
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

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="theme-btn-primary w-full"
                            style={{ padding: "0.875rem", borderRadius: "0.75rem" }}
                        >
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
                </div>
            </motion.div>
        </main>
    );
}
