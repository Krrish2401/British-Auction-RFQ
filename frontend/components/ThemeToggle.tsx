"use client";

import { useTheme, type ThemeMode } from "../lib/theme-context";

const THEME_OPTIONS: Array<{ mode: ThemeMode; label: string }> = [
    { mode: "light", label: "Light" },
    { mode: "dark", label: "Dark" },
    { mode: "system", label: "System" }
];

export default function ThemeToggle() {
    const { mode, resolvedTheme, setMode } = useTheme();

    return (
        <div className="theme-toggle-shell">
            <p className="theme-toggle-label">Theme</p>
            <div className="theme-toggle-group" role="tablist" aria-label="Theme selector">
                {THEME_OPTIONS.map((option) => (
                    <button
                        key={option.mode}
                        type="button"
                        role="tab"
                        aria-selected={mode === option.mode}
                        className={mode === option.mode ? "theme-toggle-item active" : "theme-toggle-item"}
                        onClick={() => setMode(option.mode)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            <p className="theme-toggle-meta">Current: {mode === "system" ? `System (${resolvedTheme})` : mode}</p>
        </div>
    );
}
