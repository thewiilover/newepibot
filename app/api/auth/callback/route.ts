import { NextRequest, NextResponse } from "next/server";
import { buildCookie, parseCookie } from "@/lib/cookies";
import { createSessionId } from "@/lib/session";
import { exchangeDiscordCode, fetchDiscordMe } from "@/lib/discord-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = parseCookie(request.headers.get("cookie"), "newepibot_oauth_state");

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/?auth=invalid", request.url));
  }

  const token = await exchangeDiscordCode(code);
  const profile = await fetchDiscordMe(token.access_token);
  const sessionId = createSessionId();

  await db.discordSession.upsert({
    where: { id: sessionId },
    update: {
      discordUserId: profile.id,
      username: profile.username,
      avatar: profile.avatar,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenType: token.token_type,
      scope: token.scope,
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
    },
    create: {
      id: sessionId,
      discordUserId: profile.id,
      username: profile.username,
      avatar: profile.avatar,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenType: token.token_type,
      scope: token.scope,
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
    },
  });

  const response = NextResponse.redirect(new URL("/?auth=connected", request.url));
  response.headers.set("Set-Cookie", buildCookie("newepibot_session", sessionId, { httpOnly: true, path: "/", sameSite: "lax", secure: false, maxAge: 60 * 60 * 24 * 30 }));
  response.headers.append("Set-Cookie", buildCookie("newepibot_oauth_state", "", { httpOnly: true, path: "/", sameSite: "lax", secure: false, maxAge: 0 }));
  return response;
}