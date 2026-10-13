import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Payload Peek — Catch Webhooks. Inspect Payloads. Generate TypeScript.",
  description:
    "A live webhook inbox that turns real HTTP requests into typed TypeScript interfaces and Zod schemas. Zero setup, no account needed.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-[#080d19] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 flex flex-col">
        {children}
      </body>
    </html>
  );
}
