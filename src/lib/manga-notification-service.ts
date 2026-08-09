import { EmbedBuilder, type Client, type TextBasedChannel } from "discord.js";
import { db } from "@/lib/db";
import {
  fetchMangaChapterCountByMalId,
  fetchMangaInfoById,
  fetchMangaInfoByMalId,
  fetchMangaMalIdByAniListId,
  searchMangaInfo,
  searchMangaMalIdByTitle,
} from "@/lib/manga";

export async function sendMangaNotifications(client: Client) {
  const config = await db.botConfig.findUnique({ where: { id: 1 } });
  if (!config) return;

  const channel = await client.channels.fetch(config.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;
  const textChannel = channel as TextBasedChannel;

  const tracks = await db.trackedManga.findMany();

  for (const track of tracks) {
    try {
      let media = null as Awaited<ReturnType<typeof fetchMangaInfoById>> | Awaited<ReturnType<typeof fetchMangaInfoByMalId>> | Awaited<ReturnType<typeof searchMangaInfo>>;
      let malId = track.malId;
      if (malId == null && track.source === "ANILIST" && track.sourceId) {
        malId = await fetchMangaMalIdByAniListId(track.sourceId);
        media = track.sourceId ? await fetchMangaInfoById(track.sourceId) : null;
      }

      if (malId == null) {
        malId = await searchMangaMalIdByTitle(track.title);
        media = await searchMangaInfo(track.title);
      }

      if (malId == null) {
        continue;
      }

      if (!media) {
        media = track.sourceId && track.source === "ANILIST" ? await fetchMangaInfoById(track.sourceId) : await fetchMangaInfoByMalId(malId);
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
        const embed = new EmbedBuilder()
          .setTitle(media?.title.userPreferred ?? title)
          .setDescription(`New chapter ${chapterCount} is now available.`)
          .setColor(0xf59e0b)
          .setTimestamp(new Date());

        if (media?.siteUrl) {
          embed.setURL(media.siteUrl);
        }

        if (media?.coverImage?.large) {
          embed.setThumbnail(media.coverImage.large);
        }

        await (textChannel as any).send({
          content: rolePing,
          embeds: [embed],
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