import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import ThemeToggle from "../components/ThemeToggle";
import { ThemeProvider } from "../lib/theme-context";

export const metadata: Metadata = {
    title: "RFQ Auction — Transparent Reverse Auction Platform",
    description: "Run fast, fair freight auctions with live rank clarity. The premier reverse-auction platform for transparent procurement.",
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
