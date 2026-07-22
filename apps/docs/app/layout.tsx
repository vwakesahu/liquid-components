import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import { Topbar } from "../components/topbar";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://liquidcomponents.xyz"),
  title: { default: "Liquid UI", template: "%s · Liquid UI" },
  description: "Liquid Glass components and interaction primitives for shadcn/ui.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <RootProvider theme={{ defaultTheme: "dark" }}>
          <Topbar />
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
