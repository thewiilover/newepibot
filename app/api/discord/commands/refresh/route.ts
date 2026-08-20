import { NextRequest, NextResponse } from "next/server";
import { Routes, REST } from "discord.js";
import { env } from "@/lib/env";
import { searchCommand } from "@/bot/commands/search";

export async function POST(request: NextRequest) {
  try {
    const { guildId } = await request.json();
    
    if (!guildId) {
      return NextResponse.json({ success: false, error: "guildId is required" }, { status: 400 });
    }

    const rest = new REST({ version: "10" }).setToken(env.DISCORD_BOT_TOKEN);

    const commands = [searchCommand.toJSON()];

    await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, guildId), {
      body: commands,
    });

    return NextResponse.json({ success: true, message: `Slash commands refreshed for guild ${guildId}` });
  } catch (error: unknown) {
    console.error("Failed to refresh slash commands:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}