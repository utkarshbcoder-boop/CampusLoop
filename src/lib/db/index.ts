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

let _provider: DataProvider | null = null;

export async function getDataProvider(): Promise<DataProvider> {
  if (_provider) return _provider;
  if (firebaseEnabled()) {
    const { getFirestoreProvider } = await import("@/lib/firebase/firestore");
    _provider = getFirestoreProvider();
    return _provider;
  }
  if (supabaseEnabled()) {
    const { getSupabaseProvider } = await import("./supabase");
    _provider = getSupabaseProvider();
    return _provider;
  }
  _provider = getMockProvider();
  return _provider;
}

export * from "./provider";
export { getMockProvider };
