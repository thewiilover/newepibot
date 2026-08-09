import { fetchMediaInfoById, importAniListMediaList, searchMediaInfo } from "@/lib/anilist";

const MALSYNC_API = "https://api.malsync.moe";

export async function importAniListMangaUsername(userName: string) {
  return importAniListMediaList(userName, "MANGA");
}

export async function searchMangaInfo(title: string) {
  return searchMediaInfo(title, "MANGA");
}

export async function fetchMangaInfoById(id: string) {
  return fetchMediaInfoById(id, "MANGA");
}

export async function fetchMangaMalIdByAniListId(id: string) {
  const media = await fetchMangaInfoById(id);
  return media?.idMal ?? null;
}

export async function searchMangaMalIdByTitle(title: string) {
  const media = await searchMangaInfo(title);
  return media?.idMal ?? null;
}

export async function fetchMangaChapterCountByMalId(malId: number) {
  const response = await fetch(`${MALSYNC_API}/nc/mal/manga/${malId}/pr`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`MALSync manga progress request failed (${response.status})`);
  }

  const payload = (await response.json()) as Array<{
    lastEp?: { total?: number; timestamp?: number };
    predicition?: { timestamp: number; probability: string };
  }>;

  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  const preferred = payload.find((item) => item.lastEp?.total);
  const top = preferred ?? payload[0];
  return top?.lastEp?.total ?? null;
}