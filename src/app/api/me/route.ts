import { NextResponse } from "next/server";
import { collegeById } from "@/lib/data/colleges";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const collegeId = typeof b.college_id === "string" ? b.college_id : "";

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!collegeById(collegeId)) return NextResponse.json({ error: "Unknown college" }, { status: 400 });

  const payload = {
    name,
    college_id: collegeId,
    year_of_study: Math.min(6, Math.max(1, Number(b.year_of_study) || 1)),
    credits: Math.max(0, Number(b.credits) || 0),
    rating: Math.min(5, Math.max(0, Number(b.rating) || 0)),
    skills: Array.isArray(b.skills) ? b.skills.map(String).slice(0, 12) : [],
  };

  const response = NextResponse.json({ ok: true, profile: payload });
  response.cookies.set("cl_me", JSON.stringify(payload), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
