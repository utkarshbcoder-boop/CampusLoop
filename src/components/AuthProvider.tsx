"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { completeGoogleRedirect, onAuthChange, isAdmin, signOutUser } from "@/lib/firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { computeIsShopkeeper, type AccountProfile } from "@/lib/shop";

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  /** Live `profiles/{uid}` document (role, shop identity) — null when signed out. */
  profile: AccountProfile | null;
  /** True for admin-promoted shopkeepers (admins always qualify — full access). */
  isShopkeeper: boolean;
  /** Re-fetch the current user (e.g. after verifying their email) and re-render consumers. */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isAdmin: false,
  profile: null,
  isShopkeeper: false,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [, forceAuthRender] = useState(0);

  // `User.reload()` mutates the existing instance in place, so bump a
  // counter to re-render the provider (and every context consumer) with the
  // refreshed `emailVerified` flag.
  const refreshUser = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    setUser(auth.currentUser);
    forceAuthRender((n) => n + 1);
  };

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;
    let unsubProfile: (() => void) | undefined;

    const initializeAuth = async () => {
      let redirectedUser: User | null = null;
      try {
        redirectedUser = await completeGoogleRedirect();
      } catch (error) {
        console.error("Google redirect sign-in failed:", error);
      }

      if (cancelled) return;

      // One-time migration: sessions kept under the old flag bypass the
      // per-session login requirement, so sign those users out once.
      if (!redirectedUser) {
        try {
          if (localStorage.getItem("campusloop_visited")) {
            localStorage.removeItem("campusloop_visited");
            sessionStorage.removeItem("campusloop_visited");
            signOutUser().catch(() => {});
          }
        } catch {}
      }

      unsub = onAuthChange(async (u) => {
        setUser(u);
        setLoading(false);
        unsubProfile?.();
        unsubProfile = undefined;
        if (!u) {
          setProfile(null);
          return;
        }
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
          if (cancelled) return;
          // Watch the profile so admin role grants (e.g. shopkeeper) apply
          // live, without forcing the user to sign out and back in.
          unsubProfile = onSnapshot(
            ref,
            (next) => {
              setProfile({ id: u.uid, ...(next.data() ?? {}) } as AccountProfile);
            },
            (error) => {
              console.error("Failed to watch profile:", error);
            },
          );
        } catch (e) {
          console.error("Failed to create profile:", e);
        }
      });
    };

    void initializeAuth();
    return () => {
      cancelled = true;
      unsub?.();
      unsubProfile?.();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: isAdmin(user),
        profile,
        isShopkeeper: computeIsShopkeeper(profile, isAdmin(user)),
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
