"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LoginPanel } from "@/components/LoginPanel";

function returnPath() {
  const requested = new URLSearchParams(window.location.search).get("returnTo");
  if (!requested || !requested.startsWith("/") || requested.startsWith("//")) return "/";
  const destination = new URL(requested, window.location.origin);
  return destination.origin === window.location.origin
    ? `${destination.pathname}${destination.search}${destination.hash}`
    : "/";
}

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      try {
        if (!localStorage.getItem("campusloop_keep") && !sessionStorage.getItem("campusloop_session")) {
          sessionStorage.setItem("campusloop_session", "1");
        }
      } catch {}
      router.replace(returnPath());
    }
  }, [user, loading, router]);

  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-16">
      <div className="cl-grid-bg pointer-events-none absolute inset-0" aria-hidden />
      <LoginPanel
        onGuest={() => {
          try {
            sessionStorage.setItem("campusloop_session", "1");
          } catch {}
          router.replace(returnPath());
        }}
      />
    </section>
  );
}
