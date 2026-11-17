import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "campusloop_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** `${expiry}.${hexHmac}` — must match the derivation in src/middleware.ts. */
function sessionValue(password: string): string {
  const expiry = String(Date.now() + MAX_AGE_SECONDS * 1000);
  const key = createHash("sha256").update(password).digest();
  const mac = createHmac("sha256", key).update(expiry).digest("hex");
  return `${expiry}.${mac}`;
}

/**
 * POST /api/admin/session — exchange the admin panel password for a
 * signed, HttpOnly session cookie scoped to /admin.
 *
 * When ADMIN_PANEL_PASSWORD is unset the gate is disabled and this
 * succeeds without setting a cookie (zero-config development).
 */
export async function POST(request: NextRequest) {
  const password = process.env.ADMIN_PANEL_PASSWORD;
  if (!password) return NextResponse.json({ ok: true, enabled: false });

  let provided = "";
  try {
    const body = await request.json();
    provided = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const expected = createHash("sha256").update(password).digest();
  const actual = createHash("sha256").update(provided).digest();
  if (!timingSafeEqual(expected, actual)) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, enabled: true });
  response.cookies.set(COOKIE_NAME, sessionValue(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: MAX_AGE_SECONDS,
  });
  return response;
}

/** DELETE /api/admin/session — clear the admin session cookie. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 0,
  });
  return response;
}
