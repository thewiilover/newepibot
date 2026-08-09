import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { buildCookie } from "@/lib/cookies";
import { getDiscordAuthorizeUrl } from "@/lib/discord-auth";

export const runtime = "nodejs";

export function GET() {
  const state = randomUUID();
  const response = NextResponse.redirect(getDiscordAuthorizeUrl(state));
  response.headers.set("Set-Cookie", buildCookie("newepibot_oauth_state", state, { httpOnly: true, path: "/", sameSite: "lax", secure: false, maxAge: 600 }));
  return response;
}