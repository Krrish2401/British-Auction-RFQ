"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { loginUser } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

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
        <main className="theme-page-bg theme-text flex min-h-screen items-center justify-center px-4">
            <form onSubmit={handleSubmit} className="theme-surface theme-shadow-soft w-full max-w-md rounded-lg p-6">
                <h1 className="theme-text mb-4 text-2xl font-semibold">Login</h1>

                <label className="theme-text-muted mb-2 block text-sm font-medium" htmlFor="email">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="theme-surface-soft theme-border theme-text mb-4 w-full rounded-md border px-3 py-2 outline-none disabled:opacity-60"
                />

                <label className="theme-text-muted mb-2 block text-sm font-medium" htmlFor="password">
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    required
                    disabled={isSubmitting}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="theme-surface-soft theme-border theme-text mb-4 w-full rounded-md border px-3 py-2 outline-none disabled:opacity-60"
                />

                {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="theme-accent-bg w-full rounded-md px-4 py-2 font-semibold disabled:opacity-60"
                >
                    {isSubmitting ? "Logging in..." : "Login"}
                </button>

                <p className="theme-text-muted mt-4 text-sm">
                    New here?{" "}
                    <Link className="theme-text font-medium underline" href="/register">
                        Create an account
                    </Link>
                </p>
            </form>
        </main>
    );
}
