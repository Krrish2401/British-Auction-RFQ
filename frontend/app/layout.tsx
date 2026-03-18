import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import ThemeToggle from "../components/ThemeToggle";
import { ThemeProvider } from "../lib/theme-context";

export const metadata: Metadata = {
    title: "Quote Arena — Transparent Procurement Platform",
    description: "Run fast, fair procurement rounds with live rank clarity on Quote Arena.",
    icons: {
        icon: "/favicon.svg",
        shortcut: "/favicon.svg",
        apple: "/favicon.svg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="antialiased">
                <ThemeProvider>
                    <AuthProvider>
                        <div className="theme-toggle-global-wrap">
                            <ThemeToggle />
                        </div>
                        {children}
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
