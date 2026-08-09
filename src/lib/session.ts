import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { parseCookie } from "@/lib/cookies";

const SESSION_COOKIE = "newepibot_session";

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function createSessionId() {
  return randomUUID();
}

export function getSessionIdFromRequest(request: Request) {
  return parseCookie(request.headers.get("cookie"), SESSION_COOKIE);
}

export async function getSessionFromRequest(request: Request) {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) return null;

  return db.discordSession.findUnique({ where: { id: sessionId } });
}