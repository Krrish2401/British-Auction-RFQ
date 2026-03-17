"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "../../../lib/auth-context";
import { useRequireAuth } from "../../../lib/use-require-auth";

export default function SupplierDashboardPage() {
    const router = useRouter();
    const { loading, user } = useRequireAuth("SUPPLIER");
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    if (loading || !user || user.role !== "SUPPLIER") {
        return <main className="p-6">Loading...</main>;
    }

    return (
        <main className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-5xl rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-slate-900">Supplier Dashboard</h1>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-md bg-slate-900 px-4 py-2 text-white"
                    >
                        Logout
                    </button>
                </div>
                <p className="text-slate-600">Welcome, {user.name}. Bidding screens will be added in Phase 3.</p>
            </div>
        </main>
    );
}
