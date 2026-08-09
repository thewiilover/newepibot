import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendChannelMessage } from "@/lib/discord-api";

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  const config = await db.botConfig.findUnique({ where: { id: 1 } });
  if (!config || !config.channelId) {
    return NextResponse.json({ error: "Notification target not configured" }, { status: 400 });
  }

  const rolePing = config.roleId ? `<@&${config.roleId}> ` : "";
  const content = `${rolePing}Test ping from NewEpiBot — this is only a test.`;

  try {
    await sendChannelMessage(config.channelId, content);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message ?? err) }, { status: 500 });
  }
}
