import type { Metadata } from "next";
import { Poppins, Fira_Code } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import AuthProvider from "@/components/AuthProvider";
import AuthStatus from "@/components/AuthStatus";

const primaryFont = Poppins({
  variable: "--font-primary",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const monoFont = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const currentYear = new Date().getFullYear();

export const metadata: Metadata = {
  title: "Profit Share Calculator",
  description: "Internal tool for monthly profit share allocations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${primaryFont.variable} ${monoFont.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <header className="bg-white/95">
              <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
                <Link href={`/year/${currentYear}`} className="text-2xl font-semibold text-[var(--brand-primary)]">
                  Profit Share
                </Link>
                <nav className="flex items-center gap-6 text-sm font-medium text-[var(--brand-primary)]">
                  <Link
                    href={`/year/${currentYear}`}
                    className="transition hover:text-[var(--brand-accent)]"
                  >
                    {currentYear} Overview
                  </Link>
                  <AuthStatus />
                </nav>
              </div>
            </header>
            <main className="flex-1">
              <div className="mx-auto w-full max-w-7xl px-6 py-10" data-testid="main">
                {children}
              </div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
