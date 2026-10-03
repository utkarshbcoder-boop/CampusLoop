import { NextResponse } from "next/server";
import { profileById } from "@/lib/data/profiles";

/**
 * Demo session switcher.
 *
 * Writes the chosen demo profile into a cookie. Server components read it via
 * `cookies()` in the root layout, so switching the user re-scopes every page —
 * no client-side hydration mismatch, and the "you" in the AI Match Lab really
 * changes. In a real deployment this is where Supabase Auth would go.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const profileId =
    typeof body === "object" && body !== null && "profileId" in body
      ? String((body as { profileId: unknown }).profileId)
      : "";

  if (!profileById(profileId)) {
    return NextResponse.json({ error: `Unknown profile: ${profileId}` }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true, profileId });
  response.cookies.set("cl_profile", profileId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
