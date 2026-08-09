import { NextResponse } from "next/server";
import { buildCookie } from "@/lib/cookies";

export const runtime = "nodejs";

export function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", buildCookie("newepibot_session", "", { httpOnly: true, path: "/", sameSite: "lax", secure: false, maxAge: 0 }));
  return response;
}