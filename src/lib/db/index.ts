import "server-only";
import { getMockProvider } from "./mock";
import type { DataProvider } from "./provider";

/**
 * Provider selection.
 *
 * The app is designed so that `npm run dev` works with zero configuration.
 * Set `NEXT_PUBLIC_USE_SUPABASE=true` (plus URL + anon key) to switch to Supabase Postgres.
 * Set `NEXT_PUBLIC_USE_FIREBASE=true` (plus Firebase config) to switch to Firestore.
 * Nothing else in the codebase needs to change — every module talks to
 * `getDataProvider()` and all implementations satisfy the same interface.
 */
export function firebaseEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_USE_FIREBASE !== "true") return false;
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

export function supabaseEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_USE_SUPABASE !== "true") return false;
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getDataProvider(): Promise<DataProvider> {
  if (firebaseEnabled()) {
    const { getFirestoreProvider, isFirestoreSeeded } = await import("@/lib/firebase/firestore");
    // If Firestore hasn't been seeded yet, fall back to mock data so the
    // site works out of the box. Once you seed via /admin/seed, Firestore
    // data takes over.
    const seeded = await isFirestoreSeeded();
    if (seeded) {
      return getFirestoreProvider();
    }
    // Firestore is empty — use mock data for server rendering
    return getMockProvider();
  }
  if (supabaseEnabled()) {
    // Imported lazily so the SDK never loads on the default zero-config path.
    const { getSupabaseProvider } = await import("./supabase");
    return getSupabaseProvider();
  }
  return getMockProvider();
}

export * from "./provider";
export { getMockProvider };
