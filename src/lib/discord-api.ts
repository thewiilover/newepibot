import { env } from "@/lib/env";

async function discordBotFetch(path: string) {
  const response = await fetch(`https://discord.com/api/v10${path}`, {
    headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
  });

  if (!response.ok) {
    throw new Error(`Discord bot request failed (${response.status})`);
  }

  return response;
}

export async function fetchGuildChannels(guildId: string) {
  const response = await discordBotFetch(`/guilds/${guildId}/channels`);
  return response.json() as Promise<Array<{ id: string; name: string; type: number; parent_id: string | null }>>;
}

export async function fetchGuildRoles(guildId: string) {
  const response = await discordBotFetch(`/guilds/${guildId}/roles`);
  return response.json() as Promise<Array<{ id: string; name: string; color: number }>>;
}

export async function sendChannelPayload(
  channelId: string,
  payload: { content?: string; embeds?: Array<Record<string, unknown>> },
) {
  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Discord bot request failed (${response.status}) ${text}`);
  }

  return response.json();
}

export async function sendChannelMessage(channelId: string, content: string) {
  return sendChannelPayload(channelId, { content });
}