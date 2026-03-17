"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { loginUser } from "../../lib/api";

export default function LoginPage() {
    const router = useRouter();
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

            if (user.role === "BUYER") {
                router.push("/buyer/dashboard");
                return;
            }

            router.push("/supplier/dashboard");
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Login failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg bg-white p-6 shadow">
                <h1 className="mb-4 text-2xl font-semibold text-slate-900">Login</h1>

                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-600"
                />

                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-600"
                />

                {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
                >
                    {isSubmitting ? "Logging in..." : "Login"}
                </button>

                <p className="mt-4 text-sm text-slate-600">
                    New here?{" "}
                    <Link className="font-medium text-slate-900 underline" href="/register">
                        Create an account
                    </Link>
                </p>
            </form>
        </main>
    );
}
