import { EmbedBuilder, type Client, type TextBasedChannel } from "discord.js";
import { db } from "@/lib/db";
import { sendChannelPayload } from "@/lib/discord-api";
import { fetchAiringInfoById, searchAiringInfo } from "@/lib/anilist";

export async function sendReleaseNotifications(client: Client) {
  const config = await db.botConfig.findUnique({ where: { id: 1 } });
  if (!config) return;

  const channel = await client.channels.fetch(config.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;
  const textChannel = channel as TextBasedChannel;

  const tracks = await db.trackedAnime.findMany();
  const now = new Date();

  for (const track of tracks) {
    try {
      const media = track.sourceId ? await fetchAiringInfoById(track.sourceId) : await searchAiringInfo(track.title);
      const airing = media?.nextAiringEpisode;
      if (!airing) continue;

      const airingAt = new Date(airing.airingAt * 1000);
      if (airingAt > now) {
        await db.trackedAnime.update({
          where: { id: track.id },
          data: { title: media.title.userPreferred, nextEpisode: airing.episode, nextAiringAt: airingAt },
        });
        continue;
      }

      if (track.lastNotifiedEpisode === airing.episode) {
        continue;
      }

      await sendReleasePayload(textChannel, config.roleId, media.title.userPreferred, airing.episode, airingAt, media.siteUrl, media.coverImage?.large);

      await db.trackedAnime.update({
        where: { id: track.id },
        data: {
          title: media.title.userPreferred,
          nextEpisode: airing.episode,
          nextAiringAt: airingAt,
          lastNotifiedEpisode: airing.episode,
        },
      });
    } catch {
      // Silently continue so one failing lookup does not stop the queue.
    }
  }
}

export async function forceSendReleaseNotifications() {
  const config = await db.botConfig.findUnique({ where: { id: 1 } });
  if (!config || !config.channelId) {
    return { sent: 0, skipped: 0 };
  }

  const tracks = await db.trackedAnime.findMany();
  const now = new Date();
  let sent = 0;
  let skipped = 0;

  for (const track of tracks) {
    try {
      const media = track.sourceId ? await fetchAiringInfoById(track.sourceId) : await searchAiringInfo(track.title);
      const airing = media?.nextAiringEpisode;
      if (!airing) {
        skipped += 1;
        continue;
      }

      const airingAt = new Date(airing.airingAt * 1000);
      if (airingAt > now) {
        skipped += 1;
        await db.trackedAnime.update({
          where: { id: track.id },
          data: { title: media.title.userPreferred, nextEpisode: airing.episode, nextAiringAt: airingAt },
        });
        continue;
      }

      await sendReleasePayload(null, config.roleId, media.title.userPreferred, airing.episode, airingAt, media.siteUrl, media.coverImage?.large, config.channelId);

      await db.trackedAnime.update({
        where: { id: track.id },
        data: {
          title: media.title.userPreferred,
          nextEpisode: airing.episode,
          nextAiringAt: airingAt,
          lastNotifiedEpisode: airing.episode,
        },
      });
      sent += 1;
    } catch {
      skipped += 1;
    }
  }

  return { sent, skipped };
}

async function sendReleasePayload(
  textChannel: TextBasedChannel | null,
  roleId: string | null,
  title: string,
  episode: number,
  airingAt: Date,
  siteUrl?: string | null,
  coverImageUrl?: string | null,
  channelId?: string,
) {
  const rolePing = roleId ? `<@&${roleId}> ` : "";
  const embed = new EmbedBuilder().setTitle(title).setDescription(`New episode ${episode} is now available.`).setColor(0x38bdf8).setTimestamp(airingAt);

  if (siteUrl) {
    embed.setURL(siteUrl);
  }

  if (coverImageUrl) {
    embed.setThumbnail(coverImageUrl);
  }

  if (textChannel) {
    await (textChannel as any).send({
      content: rolePing,
      embeds: [embed],
    });
    return;
  }

  if (!channelId) {
    throw new Error("Notification target not configured");
  }

  await sendChannelPayload(channelId, {
    content: rolePing,
    embeds: [embed.toJSON() as any],
  });
}

export function schedulerIntervalMs() {
  return 15 * 60 * 1000;
}

export async function nextAnimeNotificationDelayMs(now = Date.now()) {
  const tracks = await db.trackedAnime.findMany({
    select: { nextAiringAt: true },
    orderBy: { nextAiringAt: "asc" },
  });

  const nextAiringAt = tracks.find((track) => track.nextAiringAt)?.nextAiringAt;
  if (!nextAiringAt) {
    return schedulerIntervalMs();
  }

  const delay = nextAiringAt.getTime() - now;
  return Math.max(30_000, delay);
}