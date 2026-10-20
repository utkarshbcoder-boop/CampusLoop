"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SparkIcon, StarIcon } from "@/components/Icon";

/**
 * Cinematic, 3D premium hero: a tilted glass stage that follows the cursor,
 * floating crystals and a light trail. Pure CSS 3D + a couple of rAF loops —
 * no WebGL dependency, so it stays fast on every device.
 */
export function PremiumScene({ compact = false }: { compact?: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      setGlow({ x: px * 100, y: py * 100 });
      setTilt({ rx: (0.5 - py) * 14, ry: (px - 0.5) * 18 });
    };
    const onLeave = () => setTilt({ rx: 0, ry: 0 });
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-white/8">
      {/* Ambient aurora */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-32 left-1/4 h-72 w-72 animate-[cl-float_9s_ease-in-out_infinite] rounded-full bg-brand-500/25 blur-3xl" />
        <div className="absolute top-10 right-1/4 h-80 w-80 animate-[cl-float_12s_ease-in-out_infinite] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 animate-[cl-float_10s_ease-in-out_infinite] rounded-full bg-flare-400/10 blur-3xl" />
      </div>

      <div
        ref={stageRef}
        className={`relative mx-auto flex w-full max-w-7xl flex-col items-center px-4 text-center sm:px-6 ${compact ? "py-8 sm:py-10" : "py-20 sm:py-28"}`}
        style={{ perspective: "1200px" }}
      >
        {/* Cursor spotlight */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at ${glow.x}% ${glow.y}%, rgba(139,92,246,0.14), transparent 45%)`,
          }}
          aria-hidden
        />

        <span className="cl-chip cl-chip-flare mb-6 inline-flex items-center gap-1.5">
          <StarIcon width={12} height={12} /> CampusLoop Premium
        </span>

        <div
          className="transform-gpu transition-transform duration-200 ease-out"
          style={{
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <h1
            className={`font-black tracking-tight text-white ${compact ? "text-2xl sm:text-3xl" : "text-4xl sm:text-6xl"}`}
            style={{ transform: "translateZ(60px)" }}
          >
            One subscription.
            <span className="block bg-gradient-to-r from-flare-300 via-fuchsia-300 to-brand-300 bg-clip-text text-transparent">
              Every campus door opens.
            </span>
          </h1>

          <p className={`mx-auto mt-4 max-w-2xl leading-relaxed text-white/60 ${compact ? "text-xs sm:text-sm" : "text-base sm:text-lg"}`} style={{ transform: "translateZ(40px)" }}>
            Boost room and PG rentals, second-hand devices, and used-book listings. Browsing and standard listings stay free.
          </p>

          {/* Floating 3D card */}
          <div className={`relative mx-auto mt-10 w-full max-w-md ${compact ? "hidden" : ""}`} style={{ transform: "translateZ(80px)" }}>
            <div
              className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-[1px] shadow-2xl shadow-brand-500/30"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="rounded-2xl bg-ink-900/90 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-widest text-flare-300 uppercase">Premium</span>
                  <SparkIcon width={16} height={16} className="text-flare-400" />
                </div>
                <p className="mt-4 text-5xl font-black tracking-tight text-white">
                  ₹49<span className="text-lg font-semibold text-white/40">/mo</span>
                </p>
                <p className="mt-1 text-xs text-white/45">cancel in two taps · zero commission on first 3 sales</p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Link href="/college" className="cl-btn cl-btn-primary px-6 py-3 text-sm">
                    Get Premium
                  </Link>
                  <Link href="/business" className="cl-btn cl-btn-ghost px-6 py-3 text-sm">
                    See unit economics
                  </Link>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-brand-500/20 blur-2xl" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
