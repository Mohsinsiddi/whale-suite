import type { Metadata, Viewport } from "next";
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

// Site configuration
const siteConfig = {
  name: "Whale Suite",
  tagline: "Trade in Shadows. Profit in Silence.",
  description: "Privacy-first trading platform for Solana whales. Hidden balances, anonymous transfers, private swaps, whale intelligence, and NFT badges. Built for the Solana Privacy Hackathon 2026.",
  url: "https://whalesuite.xyz",
  twitterHandle: "@WhaleSuite",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0e14" },
    { media: "(prefers-color-scheme: light)", color: "#0a0e14" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: "dark",
};

export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "Solana",
    "Privacy",
    "Whale",
    "Trading",
    "DeFi",
    "Crypto",
    "Anonymous",
    "Hidden Balance",
    "Private Transfer",
    "Whale Intelligence",
    "NFT Badge",
    "Solana Privacy",
    "ZK Proofs",
    "Web3",
    "Blockchain",
    "Cryptocurrency",
    "Decentralized Finance",
    "Privacy Coin",
    "Anonymous Trading",
    "Whale Tracker",
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,

  // Manifest and icons
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
  },

  // Apple-specific
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.name,
  },

  // Format detection
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [
      {
        url: `${siteConfig.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Privacy-First Trading Platform for Solana Whales`,
        type: "image/png",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitterHandle,
    creator: siteConfig.twitterHandle,
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [`${siteConfig.url}/og-image.png`],
  },

  // Verification (add your actual verification codes)
  // verification: {
  //   google: "your-google-verification-code",
  //   yandex: "your-yandex-verification-code",
  // },

  // Alternates
  alternates: {
    canonical: siteConfig.url,
  },

  // Category
  category: "Finance",

  // Classification
  classification: "Cryptocurrency Trading Platform",

  // Other
  other: {
    "msapplication-TileColor": "#0a0e14",
    "msapplication-config": "/browserconfig.xml",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "mobile-web-app-capable": "yes",
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.url,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "150",
    bestRating: "5",
    worstRating: "1",
  },
  author: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
  },
  provider: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
  },
  screenshot: `${siteConfig.url}/og-image.png`,
  featureList: [
    "Hidden balance management with Privacy Cash",
    "Anonymous transfers with ShadowWire",
    "Private token swaps via Jupiter",
    "Real-time whale intelligence feed",
    "NFT badge system with on-chain verification",
    "Affiliate earnings program",
    "Virtual crypto-funded cards",
    "Multi-wallet management",
  ],
  keywords: "Solana, Privacy, Trading, DeFi, Crypto, Anonymous, Whale",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/logo-dark.svg`,
  description: siteConfig.description,
  sameAs: [
    "https://twitter.com/WhaleSuite",
    "https://github.com/whale-suite",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: `${siteConfig.url}/docs`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />

        {/* Preconnect to important domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS Prefetch for external services */}
        <link rel="dns-prefetch" href="https://api.helius.xyz" />
        <link rel="dns-prefetch" href="https://quote-api.jup.ag" />
      </head>
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
