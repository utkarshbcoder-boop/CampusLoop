"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", emoji: "📊" },
  { href: "/admin/seed", label: "Seed Data", emoji: "🌱" },
  { href: "/admin/colleges", label: "Colleges", emoji: "🏛️" },
  { href: "/admin/profiles", label: "Profiles", emoji: "👤" },
  { href: "/admin/listings", label: "Books", emoji: "📚" },
  { href: "/admin/equipment", label: "Equipment", emoji: "💻" },
  { href: "/admin/pg_listings", label: "PG & Rooms", emoji: "🏠" },
  { href: "/admin/teammate_posts", label: "Teams", emoji: "🧑‍💻" },
  { href: "/admin/skill_profiles", label: "Skills", emoji: "🎯" },
  { href: "/admin/events", label: "Events", emoji: "🎤" },
  { href: "/admin/services", label: "Services", emoji: "🛠️" },
  { href: "/admin/opportunities", label: "Opportunities", emoji: "💼" },
  { href: "/admin/transactions", label: "Transactions", emoji: "💰" },
  { href: "/admin/subscriptions", label: "Subscriptions", emoji: "📋" },
  { href: "/admin/sponsorships", label: "Sponsorships", emoji: "📣" },
  { href: "/admin/notifications", label: "Notifications", emoji: "🔔" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500/30 border-t-brand-500" />
          <p className="text-sm text-white/50">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="cl-panel cl-panel-solid p-8 text-center">
          <p className="text-4xl">🔒</p>
          <h1 className="mt-4 text-xl font-bold text-white">Access Denied</h1>
          <p className="mt-2 text-sm text-white/50">
            This area is restricted to the site administrator.
          </p>
          <Link href="/" className="cl-btn cl-btn-primary mt-6">
            Back to CampusLoop
          </Link>
        </div>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:flex lg:gap-6">
      {/* Sidebar */}
      <aside className="mb-6 shrink-0 lg:mb-0 lg:w-56">
        <div className="cl-panel cl-panel-solid overflow-hidden lg:sticky lg:top-20">
          <div className="border-b border-white/8 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-white">
              🛡️ Admin Panel
            </p>
            <p className="mt-0.5 text-[10px] text-white/40">{user.email}</p>
          </div>
          <nav className="flex max-h-[70vh] flex-col gap-0.5 overflow-y-auto p-2">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition",
                  isActive(item.href)
                    ? "bg-brand-500/15 text-brand-200"
                    : "text-white/55 hover:bg-white/5 hover:text-white/80",
                )}
              >
                <span className="text-sm">{item.emoji}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-white/8 p-2">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/40 transition hover:bg-white/5 hover:text-white/70"
            >
              ← Back to site
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
