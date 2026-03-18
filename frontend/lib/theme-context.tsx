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

function resolveTheme(mode: ThemeMode): "light" | "dark" {
    if (mode === "system") {
        return getSystemTheme();
    }

    return mode;
}

function applyThemeToDocument(mode: ThemeMode): "light" | "dark" {
    const resolved = resolveTheme(mode);

    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.style.colorScheme = resolved;

    return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        const storedValue = window.localStorage.getItem(THEME_STORAGE_KEY);
        const nextMode: ThemeMode =
            storedValue === "light" || storedValue === "dark" || storedValue === "system"
                ? storedValue
                : "system";

        setModeState(nextMode);
        setResolvedTheme(applyThemeToDocument(nextMode));
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const onSystemThemeChange = () => {
            if (mode === "system") {
                setResolvedTheme(applyThemeToDocument("system"));
            }
        };

        mediaQuery.addEventListener("change", onSystemThemeChange);
        return () => mediaQuery.removeEventListener("change", onSystemThemeChange);
    }, [mode]);

    const setMode = (nextMode: ThemeMode): void => {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
        setModeState(nextMode);
        setResolvedTheme(applyThemeToDocument(nextMode));
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
