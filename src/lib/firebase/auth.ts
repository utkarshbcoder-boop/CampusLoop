/**
 * Firebase auth helpers.
 *
 * The ADMIN_EMAIL constant is the single source of truth for admin access.
 * No other email can access `/admin/*` routes.
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./config";

/** The one and only admin email. */
export const ADMIN_EMAIL = "utkarshbcoder@gmail.com";

/** Whether the given user is the site admin. */
export function isAdmin(user: User | null): boolean {
  if (!user?.email) return false;
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/** Sign in with Google popup. */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/** Sign out the current user. */
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Subscribe to auth state changes. Returns an unsubscribe function. */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
