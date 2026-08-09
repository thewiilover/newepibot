import { db } from "@/lib/db";
import { fetchAiringInfoById, searchAiringInfo } from "@/lib/anilist";

export async function upsertTrackedAnime(items: Array<{ source: string; sourceId: string | null; title: string }>) {
  const saved = [] as Array<{ id: string; title: string }>;

  for (const item of items) {
    const existing = await db.trackedAnime.findFirst({
      where: item.sourceId ? { source: item.source, sourceId: item.sourceId } : { source: item.source, title: item.title },
    });

    const title = item.title.trim();
    const track = existing
      ? await db.trackedAnime.update({
          where: { id: existing.id },
          data: { title, sourceId: item.sourceId ?? existing.sourceId },
        })
      : await db.trackedAnime.create({
          data: {
            source: item.source,
            sourceId: item.sourceId,
            title,
          },
        });

    saved.push({ id: track.id, title: track.title });
  }

  return saved;
}

export async function refreshTrackedAnimeRecord(trackId: string) {
  const record = await db.trackedAnime.findUnique({ where: { id: trackId } });
  if (!record) return null;

  const media = record.sourceId ? await fetchAiringInfoById(record.sourceId) : await searchAiringInfo(record.title);
  if (!media?.nextAiringEpisode) {
    return db.trackedAnime.update({
      where: { id: trackId },
      data: { nextAiringAt: null, nextEpisode: null, title: media?.title.userPreferred ?? record.title },
    });
  }

  return db.trackedAnime.update({
    where: { id: trackId },
    data: {
      title: media.title.userPreferred,
      nextEpisode: media.nextAiringEpisode.episode,
      nextAiringAt: new Date(media.nextAiringEpisode.airingAt * 1000),
    },
  });
}

export async function refreshAllTrackedAnime() {
  const tracks = await db.trackedAnime.findMany();
  for (const track of tracks) {
    try {
      await refreshTrackedAnimeRecord(track.id);
    } catch {
      // Keep polling even if one lookup fails.
    }
  }
}