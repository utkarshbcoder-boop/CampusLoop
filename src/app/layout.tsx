import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { PremiumScene } from "@/components/PremiumScene";
import { AuthProvider } from "@/components/AuthProvider";
import { FirstVisitGate } from "@/components/FirstVisitGate";

import { getDataProvider } from "@/lib/db";
import { DEFAULT_PROFILE_ID, profileById } from "@/lib/data/profiles";
import { CampusLoopProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://campusloop.in"),
  title: {
    default: "CampusLoop — Everything Students Need, Within Their Campus",
    template: "%s · CampusLoop",
  },
  description:
    "College life is fragmented across WhatsApp groups, Instagram pages and random websites. CampusLoop brings it all into one trusted student ecosystem: used books, equipment rental, PG and roommate matching, project teammates, a skills exchange, campus events, verified services and internships.",
  keywords: [
    "campus app",
    "student marketplace India",
    "used books",
    "roommate matching",
    "project teammates",
    "skills exchange",
    "campus events",
    "campus SaaS",
  ],
  authors: [{ name: "CampusLoop" }],
  openGraph: {
    title: "CampusLoop — Everything Students Need, Within Their Campus",
    description:
      "Four modules, one trusted student ecosystem. Used books, equipment rental, homes and rooms — powered by a transparent AI matching engine.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "CampusLoop — Everything Students Need, Within Their Campus",
    description: "One trusted student ecosystem for nine parts of campus life, in India.",
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
  // One provider for the whole app, resolved once on the server.
  const provider = await getDataProvider();
  const [colleges, profiles] = await Promise.all([provider.colleges.list(), provider.profiles.list()]);

  const currentProfile = profileById(DEFAULT_PROFILE_ID) ?? profiles[0] ?? null;

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
            {currentProfile ? (
              <SiteHeader currentProfile={currentProfile} profiles={profiles} colleges={colleges} />
            ) : null}
            <main id="main">
              <PremiumScene compact />
              {children}
            </main>
            <SiteFooter colleges={colleges} />
          </CampusLoopProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
