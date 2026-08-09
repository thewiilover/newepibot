import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchGuildChannels, fetchGuildRoles } from "@/lib/discord-api";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  let channels = [] as Array<{ id: string; name: string; type: number; parent_id: string | null }>;
  let roles = [] as Array<{ id: string; name: string; color: number }>;
  const config = await db.botConfig.findUnique({ where: { id: 1 } });

  try {
    channels = await fetchGuildChannels(guildId);
  } catch (err) {
    // ignore and return empty channels
  }

  try {
    roles = await fetchGuildRoles(guildId);
  } catch (err) {
    // ignore and return empty roles
  }

  return NextResponse.json({ channels, roles, config });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const body = (await request.json()) as { channelId?: string; roleId?: string | null };

  if (!body.channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 });
  }

  const config = await db.botConfig.upsert({
    where: { id: 1 },
    update: {
      guildId,
      channelId: body.channelId,
      roleId: body.roleId ?? null,
    },
    create: {
      id: 1,
      guildId,
      channelId: body.channelId,
      roleId: body.roleId ?? null,
    },
  });

  return NextResponse.json({ config });
}