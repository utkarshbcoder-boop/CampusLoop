"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LoginPanel } from "@/components/LoginPanel";

export function FirstVisitGate() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (pathname === "/login") return;
    if (user) {
      try {
        if (!localStorage.getItem("campusloop_keep") && !sessionStorage.getItem("campusloop_session")) {
          sessionStorage.setItem("campusloop_session", "1");
        }
      } catch {}
      setShow(false);
      return;
    }
    try {
      setShow(!localStorage.getItem("campusloop_keep") && !sessionStorage.getItem("campusloop_session"));
    } catch {
      setShow(true);
    }
  }, [pathname, user]);

  if (!show || pathname === "/login") return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#040308] px-4">
      <LoginPanel
        onGuest={() => {
          try {
            sessionStorage.setItem("campusloop_session", "1");
          } catch {}
          setShow(false);
        }}
      />
    </div>
  );
}
