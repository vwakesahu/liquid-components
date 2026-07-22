import type { Metadata, Viewport } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import { Topbar } from "../components/topbar";
import { siteConfig } from "../lib/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: `${siteConfig.name} · Liquid Glass components for shadcn/ui`,
    template: `%s · ${siteConfig.name}`,
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
    title: `${siteConfig.name} · Liquid Glass components for shadcn/ui`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} · Liquid Glass components for shadcn/ui`,
    description: siteConfig.description,
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
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground antialiased">
        <RootProvider theme={{ defaultTheme: "dark" }}>
          <Topbar />
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
