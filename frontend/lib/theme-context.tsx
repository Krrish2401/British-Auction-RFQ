"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

type ThemeContextValue = {
    mode: ThemeMode;
    resolvedTheme: "light" | "dark";
    setMode: (nextMode: ThemeMode) => void;
};

const THEME_STORAGE_KEY = "rfq-theme-mode";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): "light" | "dark" {
    if (typeof window === "undefined") {
        return "light";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredThemeMode(): ThemeMode {
    if (typeof window === "undefined") {
        return "system";
    }

    const storedValue = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (storedValue === "light" || storedValue === "dark" || storedValue === "system") {
        return storedValue;
    }

    return "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>(() => readStoredThemeMode());
    const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() => getSystemTheme());

    const resolvedTheme: "light" | "dark" = mode === "system" ? systemTheme : mode;

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const onSystemThemeChange = () => {
            setSystemTheme(mediaQuery.matches ? "dark" : "light");
        };

        mediaQuery.addEventListener("change", onSystemThemeChange);
        return () => mediaQuery.removeEventListener("change", onSystemThemeChange);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", resolvedTheme);
        document.documentElement.style.colorScheme = resolvedTheme;
    }, [resolvedTheme]);

    const setMode = (nextMode: ThemeMode): void => {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
        setModeState(nextMode);
    };

    const value = useMemo(
        () => ({
            mode,
            resolvedTheme,
            setMode
        }),
        [mode, resolvedTheme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }

    return context;
}
