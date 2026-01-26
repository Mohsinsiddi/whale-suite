import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

// Force dynamic rendering for all pages to avoid MongoDB bundling issues
export const dynamic = 'force-dynamic';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Whale Suite | Trade in Shadows. Profit in Silence.",
  description: "Privacy-first trading platform for Solana whales. Hidden balances, anonymous transfers, whale intelligence, and more.",
  keywords: ["Solana", "Privacy", "Whale", "Trading", "DeFi", "Crypto"],
  authors: [{ name: "Whale Suite" }],
  openGraph: {
    title: "Whale Suite",
    description: "Trade in Shadows. Profit in Silence.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg-primary`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
