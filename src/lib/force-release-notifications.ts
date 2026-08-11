import { db } from "@/lib/db";
import { sendChannelPayload } from "@/lib/discord-api";
import { fetchAiringInfoById, searchAiringInfo } from "@/lib/anilist";

type ReleaseEmbed = {
  title: string;
  description: string;
  color: number;
  timestamp: string;
  url?: string;
  thumbnail?: { url: string };
};

function buildReleaseEmbed(title: string, episode: number, airingAt: Date, siteUrl?: string | null, coverImageUrl?: string | null): ReleaseEmbed {
  const embed: ReleaseEmbed = {
    title,
    description: `New episode ${episode} is now available.`,
    color: 0x38bdf8,
    timestamp: airingAt.toISOString(),
  };

  if (siteUrl) {
    embed.url = siteUrl;
  }

  if (coverImageUrl) {
    embed.thumbnail = { url: coverImageUrl };
  }

  return embed;
}

export async function forceSendLatestReleaseNotifications() {
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

      const rolePing = config.roleId ? `<@&${config.roleId}> ` : "";
      await sendChannelPayload(config.channelId, {
        content: rolePing,
        embeds: [buildReleaseEmbed(media.title.userPreferred, airing.episode, airingAt, media.siteUrl, media.coverImage?.large)],
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
      sent += 1;
    } catch {
      skipped += 1;
    }
  }

  return { sent, skipped };
}

export async function forceSendLatestReleaseNotificationForTrack(trackId: string) {
  const config = await db.botConfig.findUnique({ where: { id: 1 } });
  if (!config || !config.channelId) {
    return { sent: false, reason: "Notification target not configured" };
  }

  const track = await db.trackedAnime.findUnique({ where: { id: trackId } });
  if (!track) {
    return { sent: false, reason: "Tracked anime not found" };
  }

  let media = null as Awaited<ReturnType<typeof fetchAiringInfoById>> | Awaited<ReturnType<typeof searchAiringInfo>> | null;
  try {
    media = track.sourceId ? await fetchAiringInfoById(track.sourceId) : await searchAiringInfo(track.title);
  } catch {
    media = null;
  }

  const title = media?.title.userPreferred ?? track.title;
  const rolePing = config.roleId ? `<@&${config.roleId}> ` : "";
  const episode = media?.nextAiringEpisode?.episode ?? track.nextEpisode ?? null;
  const airingAt = track.nextAiringAt ?? (media?.nextAiringEpisode ? new Date(media.nextAiringEpisode.airingAt * 1000) : null);
  const embed = buildRegularReleaseEmbed(title, episode, airingAt, media?.siteUrl, media?.coverImage?.large);

  await sendChannelPayload(config.channelId, {
    content: rolePing,
    embeds: [embed],
  });

  await db.trackedAnime.update({
    where: { id: track.id },
    data: {
      title,
      nextEpisode: episode ?? track.nextEpisode,
      nextAiringAt: airingAt,
      lastNotifiedEpisode: episode ?? track.lastNotifiedEpisode,
    },
  });

  return { sent: true, title, episode };
}

function buildRegularReleaseEmbed(title: string, episode: number | null, airingAt: Date | null, siteUrl?: string | null, coverImageUrl?: string | null): ReleaseEmbed {
  const embed: ReleaseEmbed = {
    title,
    description: episode ? `Episode ${episode} is now available.` : "New episode is now available.",
    color: 0x38bdf8,
    timestamp: (airingAt ?? new Date()).toISOString(),
  };

  if (siteUrl) {
    embed.url = siteUrl;
  }

  if (coverImageUrl) {
    embed.thumbnail = { url: coverImageUrl };
  }

  return embed;
}
