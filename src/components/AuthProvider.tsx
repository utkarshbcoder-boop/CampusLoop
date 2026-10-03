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
import { onAuthChange, isAdmin } from "@/lib/firebase/auth";
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
