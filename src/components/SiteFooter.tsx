import Link from "next/link";
import { NAV_MODULES } from "@/lib/nav";
import type { College } from "@/lib/types";

export function SiteFooter({ colleges }: { colleges: College[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-white/8 bg-ink-900/50">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 font-black text-white">
                C
              </span>
              <span className="text-[15px] font-bold tracking-tight text-white">CampusLoop</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
              College life is fragmented across WhatsApp groups, Instagram pages and random websites. CampusLoop brings
              it all into one trusted student ecosystem.
            </p>
            <p className="mt-4 text-xs text-white/35">
              Live across {colleges.length} colleges · {colleges.reduce((a, c) => a + c.campusloop_students, 0).toLocaleString("en-IN")}{" "}
              verified students
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-wider text-white/45 uppercase">Nine modules</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {NAV_MODULES.map((m) => (
                <li key={m.href}>
                  <Link href={m.href} className="text-sm text-white/55 transition hover:text-white">
                    <span className="mr-1.5" aria-hidden>
                      {m.emoji}
                    </span>
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-wider text-white/45 uppercase">Platform</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              <li>
                <Link href="/settings" className="text-sm text-white/55 transition hover:text-white">
                  Settings
                </Link>
              </li>
              <li>
                <Link href="/college" className="text-sm text-white/55 transition hover:text-white">
                  College SaaS dashboard
                </Link>
              </li>
              <li>
                <Link href="/premium" className="text-sm text-white/55 transition hover:text-white">
                  Premium ₹99/month
                </Link>
              </li>
              <li>
                <Link href="/business" className="text-sm text-white/55 transition hover:text-white">
                  Business model &amp; unit economics
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="cl-divider mt-12" />
        <div className="mt-6 flex flex-col gap-3 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} CampusLoop. Built for students, priced in rupees, verified with student IDs.
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Runs on seeded local data — no setup needed</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
