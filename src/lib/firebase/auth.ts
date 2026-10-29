/**
 * Firebase auth helpers.
 *
 * The ADMIN_EMAIL constant is the single source of truth for admin access.
 * No other email can access `/admin/*` routes.
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User,
} from "firebase/auth";
import { deleteUser } from "firebase/auth";
import { auth } from "./config";

/** The one and only admin email. */
export const ADMIN_EMAIL = "utkarshbcoder@gmail.com";

/** Whether the given user is the site admin. */
export function isAdmin(user: User | null): boolean {
  if (!user?.email || !user.emailVerified) return false;
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/** Sign in with Google, using a redirect on mobile browsers. */
export async function signInWithGoogle(keepLoggedIn = false): Promise<User | null> {
  await setPersistence(auth, keepLoggedIn ? browserLocalPersistence : browserSessionPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  if (typeof navigator !== "undefined" && /(Android|iPhone|iPad|iPod|Mobile)/i.test(navigator.userAgent)) {
    await signInWithRedirect(auth, provider);
    return null;
  }
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/** Sign in, or create the account if the email is new. */
export async function signInWithEmail(email: string, password: string, keepLoggedIn = false): Promise<User> {
  await setPersistence(auth, keepLoggedIn ? browserLocalPersistence : browserSessionPersistence);
  const r = await signInWithEmailAndPassword(auth, email, password);
  return r.user;
}

/** Send a password reset email for an email/password account. */
export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/** Create a new account with email and password. */
export async function signUpWithEmail(name: string, email: string, password: string, keepLoggedIn = false): Promise<User> {
  await setPersistence(auth, keepLoggedIn ? browserLocalPersistence : browserSessionPersistence);
  const r = await createUserWithEmailAndPassword(auth, email, password);
  if (name.trim()) {
    await updateProfile(r.user, { displayName: name.trim() });
  }
  return r.user;
}

import { doc, deleteDoc } from "firebase/firestore";
import { db } from "./config";

/** Permanently delete the signed-in user's account and profile. */
export async function deleteCurrentAccount(): Promise<void> {
  const u = auth.currentUser;
  if (!u) throw new Error("No signed-in user");
  try {
    await deleteDoc(doc(db, "profiles", u.uid));
  } catch {}
  try {
    localStorage.removeItem("campusloop_keep");
    sessionStorage.removeItem("campusloop_session");
  } catch {}
  await deleteUser(u);
}

/** Sign out the current user. */
export async function signOutUser(): Promise<void> {
  try {
    localStorage.removeItem("campusloop_keep");
    localStorage.removeItem("campusloop_visited");
    sessionStorage.removeItem("campusloop_session");
    sessionStorage.removeItem("campusloop_visited");
  } catch {}
  await firebaseSignOut(auth);
}

/** Subscribe to auth state changes. Returns an unsubscribe function. */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
