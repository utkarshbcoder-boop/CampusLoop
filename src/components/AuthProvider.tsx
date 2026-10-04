"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthChange, isAdmin, signOutUser } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/config";

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // One-time migration: sessions kept under the old flag bypass the
    // per-session login requirement, so sign those users out once.
    try {
      if (localStorage.getItem("campusloop_visited")) {
        localStorage.removeItem("campusloop_visited");
        sessionStorage.removeItem("campusloop_visited");
        signOutUser().catch(() => {});
      }
    } catch {}

    const unsub = onAuthChange(async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        try {
          const ref = doc(db, "profiles", u.uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await setDoc(ref, {
              id: u.uid,
              name: u.displayName || "",
              email: u.email || "",
              photo_url: u.photoURL || "",
              handle: (u.email || "").split("@")[0],
              college_id: "",
              created_at: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.error("Failed to create profile:", e);
        }
      }
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: isAdmin(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
