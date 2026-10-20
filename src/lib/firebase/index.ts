/**
 * Firebase barrel export.
 *
 * Re-exports everything so the rest of the app can `import { db, auth, ... } from "@/lib/firebase"`.
 */

export { app, auth, db } from "./config";
export { ADMIN_EMAIL, isAdmin, signInWithGoogle, signOutUser, onAuthChange } from "./auth";
export { getFirestoreProvider } from "./firestore";
export { useCollection } from "./hooks";
