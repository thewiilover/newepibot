import { env } from "@/lib/env";

type DiscordTokenPayload = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
};

export function getDiscordAuthorizeUrl(state: string) {
  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", env.DISCORD_CLIENT_ID);
  url.searchParams.set("redirect_uri", env.DISCORD_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify guilds");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeDiscordCode(code: string): Promise<DiscordTokenPayload> {
  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.DISCORD_REDIRECT_URI,
  });

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Discord token exchange failed (${response.status})`);
  }

  return response.json() as Promise<DiscordTokenPayload>;
}

export async function refreshDiscordToken(refreshToken: string): Promise<DiscordTokenPayload> {
  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Discord token refresh failed (${response.status})`);
  }

  return response.json() as Promise<DiscordTokenPayload>;
}

export async function fetchDiscordMe(accessToken: string) {
  const response = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Discord profile lookup failed (${response.status})`);
  }

  return response.json() as Promise<{ id: string; username: string; global_name?: string | null; avatar?: string | null }>;
}

export async function fetchDiscordGuilds(accessToken: string) {
  const response = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Discord guild lookup failed (${response.status})`);
  }

  return response.json() as Promise<Array<{ id: string; name: string; icon: string | null; owner: boolean; permissions: string }>>;
}