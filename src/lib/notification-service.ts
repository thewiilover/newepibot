import type { Client, TextBasedChannel } from "discord.js";
import { db } from "@/lib/db";
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

      const rolePing = config.roleId ? `<@&${config.roleId}> ` : "";
      await (textChannel as any).send({
        content: `${rolePing}New episode alert: **${media.title.userPreferred}** Episode ${airing.episode} is now available on AniList timing data.`,
      });

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

export function schedulerIntervalMs() {
  return 15 * 60 * 1000;
}