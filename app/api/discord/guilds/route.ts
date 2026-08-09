import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  // Return the guilds the bot is in (upserted by the bot process on ready).
  const guilds = await db.botGuild.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ guilds: guilds.map((g) => ({ id: g.id, name: g.name, icon: g.icon })) });
}