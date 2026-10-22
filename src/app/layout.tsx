import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthProvider } from "@/components/AuthProvider";
import { FirstVisitGate } from "@/components/FirstVisitGate";
import { SettingsAccessibilityEffect } from "@/components/SettingsPreferences";
import { MarketplaceNotificationListener } from "@/components/MarketplaceNotificationListener";

import { CampusLoopProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://campusloop.in"),
  title: { default: "CampusLoop — Second-hand Items & Homes", template: "%s · CampusLoop" },
  description:
    "Browse second-hand books and devices, or find rooms, flats, and PGs to rent or buy near campus.",
  keywords: [
    "student marketplace India",
    "used books",
    "second-hand devices",
    "rooms and flats near campus",
    "PG rooms",
  ],
  authors: [{ name: "CampusLoop" }],
  openGraph: {
    title: "CampusLoop — Second-hand Items & Homes",
    description: "Second-hand books and devices, plus rooms, flats, and PGs to rent or buy near campus.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusLoop — Second-hand Items & Homes",
    description: "A student marketplace for second-hand items and homes in India.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#05050a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.add('light')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-200 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <AuthProvider>
          <CampusLoopProvider>
            <FirstVisitGate />
            <SettingsAccessibilityEffect />
            <MarketplaceNotificationListener />
            <SiteHeader />
            <main id="main">
              {children}
            </main>
            <SiteFooter />
          </CampusLoopProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
