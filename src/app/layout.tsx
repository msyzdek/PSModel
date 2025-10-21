import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
              <Link href={`/year/${currentYear}`} className="text-lg font-semibold">
                Profit Share
              </Link>
              <nav className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <Link
                  href={`/year/${currentYear}`}
                  className="rounded-md px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {currentYear} Overview
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-6 py-6" data-testid="main">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
