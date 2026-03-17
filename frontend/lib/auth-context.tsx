"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getMe, logoutUser, type AuthUser } from "./api";

type AuthContextValue = {
    user: AuthUser | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async (): Promise<void> => {
        try {
            const me = await getMe();
            setUser(me);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        await logoutUser();
        setUser(null);
    };

    useEffect(() => {
        void refreshUser();
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            refreshUser,
            logout
        }),
        [user, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }

    return context;
}
