"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LoginPanel } from "@/components/LoginPanel";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      try {
        localStorage.setItem("campusloop_visited", "1");
      } catch {}
      router.replace("/");
    }
  }, [user, loading, router]);

  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-16">
      <div className="cl-grid-bg pointer-events-none absolute inset-0" aria-hidden />
      <LoginPanel
        onGuest={() => {
          try {
            localStorage.setItem("campusloop_visited", "1");
          } catch {}
          router.replace("/");
        }}
      />
    </section>
  );
}
