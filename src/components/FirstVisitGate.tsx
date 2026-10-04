"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function FirstVisitGate() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/login") return;
    try {
      if (!localStorage.getItem("campusloop_visited")) {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [pathname, router]);

  return null;
}
