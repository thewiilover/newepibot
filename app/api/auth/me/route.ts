import { NextRequest, NextResponse } from "next/server";
import { parseCookie } from "@/lib/cookies";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sessionId = parseCookie(request.headers.get("cookie"), "newepibot_session");
  if (!sessionId) return NextResponse.json({ user: null }, { status: 401 });

  const session = await db.discordSession.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({
    user: {
      id: session.discordUserId,
      username: session.username,
      avatar: session.avatar,
    },
  });
}