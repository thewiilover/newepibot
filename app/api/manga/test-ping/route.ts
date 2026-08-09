import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendChannelPayload } from "@/lib/discord-api";
import { buildMangaTestPingEmbeds } from "@/lib/test-ping-embeds";

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  const config = await db.botConfig.findUnique({ where: { id: 1 } });
  if (!config || !config.channelId) {
    return NextResponse.json({ error: "Notification target not configured" }, { status: 400 });
  }

  const tracks = await db.trackedManga.findMany({ orderBy: { updatedAt: "desc" } });
  const rolePing = config.mangaRoleId ? `<@&${config.mangaRoleId}> ` : "";

  try {
    await sendChannelPayload(config.channelId, {
      content: `${rolePing}Manga test ping from NewEpiBot`,
      embeds: buildMangaTestPingEmbeds(tracks),
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message ?? err) }, { status: 500 });
  }
}