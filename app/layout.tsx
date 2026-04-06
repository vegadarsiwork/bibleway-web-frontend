import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "./lib/i18n";
import { ChatProvider } from "./lib/ChatContext";
import { ThemeProvider } from "./lib/ThemeContext";
import QueryProvider from "./lib/QueryProvider";
import { ToastProvider } from "./components/Toast";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-headline",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bibleway — The Modern Sanctuary",
  description:
    "A faith-based community platform for Bible reading, prayer, and fellowship.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface font-body antialiased">
        <QueryProvider><ThemeProvider><ToastProvider><I18nProvider><ChatProvider>{children}</ChatProvider></I18nProvider></ToastProvider></ThemeProvider></QueryProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
