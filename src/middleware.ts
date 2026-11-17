import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "campusloop_admin";

/**
 * Verify the HMAC-signed admin session cookie.
 *
 * Value shape: `${expiryMillis}.${hexHmac}` where the HMAC key is
 * SHA-256(ADMIN_PANEL_PASSWORD) and the message is the expiry string —
 * identical to the derivation in `src/app/api/admin/session/route.ts`.
 *
 * When ADMIN_PANEL_PASSWORD is not configured the gate is disabled and
 * access falls back to the Firebase admin check in `admin/layout.tsx`
 * (plus the Firestore rules, which are the real enforcement layer).
 */
async function verifySession(cookieValue: string | undefined): Promise<boolean> {
  const password = process.env.ADMIN_PANEL_PASSWORD;
  if (!password) return true;
  if (!cookieValue) return false;

  const separator = cookieValue.indexOf(".");
  if (separator <= 0) return false;
  const expiryStr = cookieValue.slice(0, separator);
  const signature = cookieValue.slice(separator + 1);
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return false;

  try {
    const keyMaterial = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(password),
    );
    const key = await crypto.subtle.importKey(
      "raw",
      keyMaterial,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(expiryStr));
    const expected = Array.from(new Uint8Array(mac))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    if (signature.length !== expected.length) return false;
    // Constant-time comparison.
    let diff = 0;
    for (let i = 0; i < expected.length; i += 1) {
      diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (await verifySession(cookie)) {
    return NextResponse.next();
  }
  const loginUrl = new URL("/admin-login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Server-side gate for every /admin route. The Firebase admin check in
  // admin/layout.tsx remains as a second layer, and Firestore rules remain
  // the final enforcement layer.
  matcher: ["/admin/:path*"],
};
