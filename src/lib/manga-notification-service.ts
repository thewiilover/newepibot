import type { Client, TextBasedChannel } from "discord.js";
import { db } from "@/lib/db";
import { fetchMangaChapterCountByMalId, fetchMangaMalIdByAniListId, searchMangaMalIdByTitle } from "@/lib/manga";

export async function sendMangaNotifications(client: Client) {
  const config = await db.botConfig.findUnique({ where: { id: 1 } });
  if (!config) return;

  const channel = await client.channels.fetch(config.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;
  const textChannel = channel as TextBasedChannel;

  const tracks = await db.trackedManga.findMany();

  for (const track of tracks) {
    try {
      let malId = track.malId;
      if (malId == null && track.source === "ANILIST" && track.sourceId) {
        malId = await fetchMangaMalIdByAniListId(track.sourceId);
      }

      if (malId == null) {
        malId = await searchMangaMalIdByTitle(track.title);
      }

      if (malId == null) {
        continue;
      }

      if (track.malId !== malId) {
        await db.trackedManga.update({
          where: { id: track.id },
          data: { malId },
        });
      }

      const chapterCount = await fetchMangaChapterCountByMalId(malId);
      if (chapterCount == null) continue;

      const title = track.title;

      if (track.chapterCount == null) {
        await db.trackedManga.update({
          where: { id: track.id },
          data: { chapterCount },
        });
        continue;
      }

      if (chapterCount > track.chapterCount && track.lastNotifiedChapter !== chapterCount) {
        const rolePing = config.mangaRoleId ? `<@&${config.mangaRoleId}> ` : "";
        await (textChannel as any).send({
          content: `${rolePing}New manga chapter alert: **${title}** chapter ${chapterCount} is now available.`,
        });

        await db.trackedManga.update({
          where: { id: track.id },
          data: {
            chapterCount,
            lastNotifiedChapter: chapterCount,
          },
        });
        continue;
      }

      if (chapterCount !== track.chapterCount) {
        await db.trackedManga.update({
          where: { id: track.id },
          data: {
            chapterCount,
          },
        });
      }
    } catch {
      // Silently continue so one failing lookup does not stop the queue.
    }
  }
}