"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CloseIcon, MenuIcon, StarIcon } from "@/components/Icon";
import { LoginButton } from "@/components/LoginButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NAV_MODULES, UTILITY_LINKS } from "@/lib/nav";
import { useCampusLoop } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { College, Profile } from "@/lib/types";

export function SiteHeader(_props: {
  currentProfile: Profile;
  profiles: Profile[];
  colleges: College[];
}) {
  const pathname = usePathname();
  const { premium, hydrated } = useCampusLoop();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const [sellType, setSellType] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      if (pathname.startsWith("/sell")) {
        setSellType(new URLSearchParams(window.location.search).get("type"));
      } else {
        setSellType(null);
      }
    };
    update();
    window.addEventListener("selltype", update);
    return () => window.removeEventListener("selltype", update);
  }, [pathname]);

  const isSellBook = sellType === "book" || (pathname.startsWith("/sell") && sellType !== "device");
  const isSellDevice = sellType === "device";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-brand-400/15 bg-ink-950/95 shadow-[0_12px_40px_-28px_rgba(99,102,241,0.65)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:py-5">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="CampusLoop home">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-fuchsia-500 text-lg font-black text-white shadow-lg shadow-brand-600/35">
              C
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight text-white">CampusLoop</span>
              <span className="mt-0.5 hidden text-[10px] text-white/40 sm:block">Everything within your campus</span>
            </span>
          </Link>

          {/* Desktop module nav */}
          <nav className="ml-2 hidden flex-1 items-center justify-center gap-1 xl:flex" aria-label="Modules">
            {NAV_MODULES.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-semibold transition",
                  isActive(m.href)
                    ? "bg-brand-500/18 text-brand-100 ring-1 ring-brand-300/20"
                    : "text-white/65 hover:bg-white/7 hover:text-white",
                )}
              >
                {m.short}
              </Link>
            ))}
            <Link
              href="/marketplace"
              className={cn(
                "rounded-xl border px-3 py-2 text-sm font-bold transition",
                isActive("/marketplace")
                  ? "border-brand-300/40 bg-brand-500/20 text-white"
                  : "border-brand-300/20 bg-gradient-to-r from-brand-500/10 to-fuchsia-500/10 text-brand-100 hover:border-brand-300/40 hover:from-brand-500/20 hover:to-fuchsia-500/20",
              )}
            >
              🛍️ Marketplace
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/sell?type=book"
              className={cn(
                "cl-btn hidden gap-1.5 px-4 py-2.5 text-sm sm:inline-flex",
                isSellBook ? "cl-btn-primary" : "cl-btn-ghost",
              )}
            >
              Sell Books
            </Link>
            <Link
              href="/sell?type=device"
              className={cn(
                "cl-btn hidden gap-1.5 px-4 py-2.5 text-sm sm:inline-flex",
                isSellDevice ? "cl-btn-primary" : "cl-btn-ghost",
              )}
            >
              Sell Device
            </Link>

            <Link
              href="/premium"
              className={cn("cl-btn hidden md:inline-flex gap-1.5", isActive("/premium") ? "cl-btn-flare" : "cl-btn-ghost")}
            >
              <StarIcon width={14} height={14} />
              Go Premium
            </Link>
            {hydrated && premium ? (
              <span className="hidden items-center gap-1 rounded-full border border-flare-400/35 bg-flare-500/10 px-2.5 py-1 text-[11px] font-semibold text-flare-200 lg:inline-flex">
                🛡️ Verified seller
              </span>
            ) : null}

            <ThemeToggle />
            <LoginButton />

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="cl-btn cl-btn-ghost px-2.5 xl:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="cl-panel-solid absolute inset-x-3 top-3 max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-2xl p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wider text-white/45 uppercase">All nine modules</p>
              <button type="button" onClick={() => setOpen(false)} className="cl-btn cl-btn-ghost px-2 py-1">
                <CloseIcon width={16} height={16} />
              </button>
            </div>
            <div className="grid gap-2">
              {NAV_MODULES.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-3 py-2.5 transition",
                    isActive(m.href)
                      ? "border-brand-400/40 bg-brand-500/12"
                      : "border-white/8 bg-white/4 hover:border-white/16",
                  )}
                >
                  <span className="text-lg" aria-hidden>
                    {m.emoji}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{m.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-white/45">{m.blurb}</span>
                  </span>
                </Link>
              ))}
            </div>
            <div className="cl-divider my-4" />
            <div className="grid gap-2">
              <Link
                href="/sell?type=book"
                className={cn("cl-btn justify-start", isSellBook ? "cl-btn-primary" : "cl-btn-ghost")}
              >
                📚 Sell Books
              </Link>
              <Link
                href="/sell?type=device"
                className={cn("cl-btn justify-start", isSellDevice ? "cl-btn-primary" : "cl-btn-ghost")}
              >
                💻 Sell 2nd Hand Device
              </Link>
            </div>
            <div className="cl-divider my-4" />
            <div className="grid gap-2">
              {UTILITY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "cl-btn justify-start",
                    isActive(link.href) ? "cl-btn-primary" : "cl-btn-ghost",
                  )}
                >
                  <span aria-hidden>{link.emoji}</span>
                  {link.label}
                </Link>
              ))}
              <Link
                href="/premium"
                className={cn("cl-btn justify-start", premium ? "cl-btn-flare" : "cl-btn-ghost")}
              >
                <StarIcon width={15} height={15} />
                {premium ? "Manage Premium" : "See Premium benefits"}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
