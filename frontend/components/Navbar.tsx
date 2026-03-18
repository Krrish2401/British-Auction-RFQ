"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, LayoutDashboard, Plus } from "lucide-react";

import { useAuth } from "../lib/auth-context";

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isAuth = pathname === "/login" || pathname === "/register";

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    const dashboardPath = user?.role === "BUYER" ? "/buyer/dashboard" : "/supplier/dashboard";

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="fixed left-0 right-0 top-0 z-50"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div
                    className="theme-glass mt-3 flex h-14 items-center justify-between rounded-2xl px-5"
                    style={{ boxShadow: "var(--shadow-soft)" }}
                >
                    <Link href="/" className="flex items-center gap-2.5">
                        <Image src="/logo.png" alt="Quote Arena logo" width={32} height={32} className="h-8 w-8 object-contain" priority />
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--muted-foreground)" }}>
                                Quote Arena
                            </p>
                            <p className="text-sm" style={{ fontFamily: "var(--font-heading)", lineHeight: "0.9", letterSpacing: "0.06em", color: "var(--foreground)" }}>
                                Procurement Platform
                            </p>
                        </div>
                    </Link>

                    <div className="hidden items-center gap-1 md:flex">
                        {user ? (
                            <>
                                <Link href={dashboardPath} className="theme-btn-ghost flex items-center gap-1.5 text-xs">
                                    <LayoutDashboard size={14} />
                                    Dashboard
                                </Link>
                                {user.role === "BUYER" && (
                                    <Link href="/buyer/rfq/create" className="theme-btn-ghost flex items-center gap-1.5 text-xs">
                                        <Plus size={14} />
                                        New RFQ
                                    </Link>
                                )}
                                <div className="mx-2 h-6 w-px" style={{ background: "var(--border)" }} />
                                <span className="mr-2 text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                                    {user.name}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="theme-btn-ghost flex items-center gap-1.5 text-xs"
                                    style={{ color: "var(--danger)" }}
                                    title="Logout"
                                >
                                    <LogOut size={14} />
                                </button>
                            </>
                        ) : (
                            <>
                                {!isAuth && (
                                    <>
                                        <Link href="/login" className="theme-btn-ghost text-xs">
                                            Sign In
                                        </Link>
                                        <Link href="/register" className="theme-btn-primary text-xs" style={{ padding: "0.5rem 1.2rem" }}>
                                            Start Free
                                        </Link>
                                    </>
                                )}
                                {isAuth && pathname === "/login" && (
                                    <Link href="/register" className="theme-btn-primary text-xs" style={{ padding: "0.5rem 1.2rem" }}>
                                        Create Account
                                    </Link>
                                )}
                                {isAuth && pathname === "/register" && (
                                    <Link href="/login" className="theme-btn-ghost text-xs">
                                        Sign In
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    <button
                        className="theme-btn-ghost md:hidden"
                        onClick={() => setMobileOpen((prev) => !prev)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden md:hidden"
                    >
                        <div className="mx-4 mt-2 rounded-xl p-4 theme-glass" style={{ boxShadow: "var(--shadow-soft)" }}>
                            <div className="flex flex-col gap-2">
                                {user ? (
                                    <>
                                        <span className="px-3 py-1 text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                                            Signed in as {user.name}
                                        </span>
                                        <Link href={dashboardPath} className="theme-btn-ghost justify-start text-sm" onClick={() => setMobileOpen(false)}>
                                            Dashboard
                                        </Link>
                                        {user.role === "BUYER" && (
                                            <Link href="/buyer/rfq/create" className="theme-btn-ghost justify-start text-sm" onClick={() => setMobileOpen(false)}>
                                                New RFQ
                                            </Link>
                                        )}
                                        <button onClick={handleLogout} className="theme-btn-ghost justify-start text-sm" style={{ color: "var(--danger)" }}>
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login" className="theme-btn-ghost justify-start text-sm" onClick={() => setMobileOpen(false)}>
                                            Sign In
                                        </Link>
                                        <Link href="/register" className="theme-btn-primary text-sm" onClick={() => setMobileOpen(false)}>
                                            Start Free
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
