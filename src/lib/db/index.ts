import "server-only";
import { getMockProvider } from "./mock";
import type { DataProvider } from "./provider";

/**
 * Provider selection.
 *
 * The app is designed so that `npm run dev` works with zero configuration.
 * Set `NEXT_PUBLIC_USE_SUPABASE=true` (plus URL + anon key) to switch to Postgres.
 * Nothing else in the codebase needs to change — every module talks to
 * `getDataProvider()` and both implementations satisfy the same interface.
 */
export function supabaseEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_USE_SUPABASE !== "true") return false;
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getDataProvider(): Promise<DataProvider> {
  if (supabaseEnabled()) {
    // Imported lazily so the SDK never loads on the default zero-config path.
    const { getSupabaseProvider } = await import("./supabase");
    return getSupabaseProvider();
  }
  return getMockProvider();
}

export * from "./provider";
export { getMockProvider };
