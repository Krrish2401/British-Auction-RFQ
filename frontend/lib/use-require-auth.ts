"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "./auth-context";

export function useRequireAuth(expectedRole: "BUYER" | "SUPPLIER") {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            router.replace("/login");
            return;
        }

        if (user.role !== expectedRole) {
            if (user.role === "BUYER") {
                router.replace("/buyer/dashboard");
                return;
            }

            router.replace("/supplier/dashboard");
        }
    }, [user, loading, expectedRole, router]);

    return { user, loading };
}
