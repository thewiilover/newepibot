import { db } from "@/lib/db";
import { fetchMangaChapterCountByMalId, fetchMangaMalIdByAniListId, searchMangaMalIdByTitle } from "@/lib/manga";

export async function upsertTrackedManga(items: Array<{ source: string; sourceId: string | null; malId: number | null; title: string }>) {
  const saved = [] as Array<{ id: string; title: string }>;

  for (const item of items) {
    const existing = await db.trackedManga.findFirst({
      where: item.sourceId ? { source: item.source, sourceId: item.sourceId } : { source: item.source, title: item.title },
    });

    const title = item.title.trim();
    const track = existing
      ? await db.trackedManga.update({
          where: { id: existing.id },
          data: { title, sourceId: item.sourceId ?? existing.sourceId, malId: item.malId ?? existing.malId },
        })
      : await db.trackedManga.create({
          data: {
            source: item.source,
            sourceId: item.sourceId,
            malId: item.malId,
            title,
          },
        });

    saved.push({ id: track.id, title: track.title });
  }

  return saved;
}

export async function syncTrackedMangaRecord(trackId: string) {
  const record = await db.trackedManga.findUnique({ where: { id: trackId } });
  if (!record) return null;

  let malId = record.malId;
  if (malId == null && record.source === "ANILIST" && record.sourceId) {
    malId = await fetchMangaMalIdByAniListId(record.sourceId);
  }

  if (malId == null) {
    malId = await searchMangaMalIdByTitle(record.title);
  }

  if (malId == null) return null;

  if (record.malId !== malId) {
    await db.trackedManga.update({
      where: { id: trackId },
      data: { malId },
    });
  }

  const chapterCount = await fetchMangaChapterCountByMalId(malId);
  if (chapterCount == null) return null;

  return db.trackedManga.update({
    where: { id: trackId },
    data: {
      chapterCount,
    },
  });
}

export async function refreshAllTrackedManga() {
  const tracks = await db.trackedManga.findMany();
  for (const track of tracks) {
    try {
      await syncTrackedMangaRecord(track.id);
    } catch {
      // Keep syncing even if one lookup fails.
    }
  }
}