import type { Metadata, Viewport } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import { liquidSpring } from "@liquid-ui/core";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { MobileNav } from "../components/mobile-nav";
import { NoImageDrag } from "../components/no-image-drag";
import { ThemeSync } from "../components/theme/sync";
import { Topbar } from "../components/topbar";
import { siteConfig } from "../lib/site";

import "./globals.css";

// One family for everything: Geist for text and titles, Geist Mono for code.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: `${siteConfig.name}, Liquid Glass components for shadcn/ui`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  authors: [siteConfig.author],
  creator: siteConfig.author.name,
  publisher: siteConfig.name,
  category: "technology",
  keywords: [
    "Liquid Glass",
    "React components",
    "shadcn/ui",
    "Radix UI",
    "component registry",
  ],
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/docs",
    siteName: siteConfig.name,
    title: `${siteConfig.name}, Liquid Glass components for shadcn/ui`,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "Liquid UI, Liquid Glass components for React and shadcn/ui",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name}, Liquid Glass components for shadcn/ui`,
    description: siteConfig.description,
    site: siteConfig.xHandle,
    creator: siteConfig.xHandle,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${geist.variable} ${geistMono.variable}`} style={{ "--liquid-spring-css": liquidSpring } as React.CSSProperties} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground antialiased">
        <RootProvider theme={{ defaultTheme: "light" }}>
          <Topbar />
          {children}
          <MobileNav />
          <ThemeSync />
          <NoImageDrag />
        </RootProvider>
      </body>
    </html>
  );
}
