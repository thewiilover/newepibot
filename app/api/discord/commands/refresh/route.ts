import { NextRequest, NextResponse } from "next/server";
import { Routes, REST } from "discord.js";
import { env } from "@/lib/env";
import { searchCommand } from "@/bot/commands/search";

export async function POST(request: NextRequest) {
  try {
    const rest = new REST({ version: "10" }).setToken(env.DISCORD_BOT_TOKEN);

    const commands = [searchCommand.toJSON()];

    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
      body: commands,
    });

    return NextResponse.json({ success: true, message: "Slash commands refreshed globally" });
  } catch (error: unknown) {
    console.error("Failed to refresh slash commands:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}