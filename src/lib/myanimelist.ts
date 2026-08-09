import { XMLParser } from "fast-xml-parser";

type MediaType = "anime" | "manga";

type MalMediaEntry = {
  series_title?: string;
  my_status?: string | number;
  series_mangadb_id?: string | number;
  manga_id?: string | number;
  anime_id?: string | number;
};

export function importMyAnimeListXml(xmlText: string) {
  return importMyAnimeListMediaXml(xmlText, "anime");
}

export function importMyAnimeListMangaXml(xmlText: string) {
  return importMyAnimeListMediaXml(xmlText, "manga");
}

export function importMyAnimeListMediaXml(xmlText: string, mediaType: MediaType) {
  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  const parsed = parser.parse(xmlText) as { myanimelist?: { anime?: MalMediaEntry | MalMediaEntry[]; manga?: MalMediaEntry | MalMediaEntry[] } };
  const entries = parsed.myanimelist?.[mediaType];
  const mediaEntries = Array.isArray(entries) ? entries : entries ? [entries] : [];

  const allowedStatuses = mediaType === "manga" ? new Set(["1", "reading", "6", "plan to read"]) : new Set(["1", "watching", "6", "plan to watch"]);

  return mediaEntries
    .filter((entry) => {
      const status = String(entry.my_status ?? "").toLowerCase();
      return allowedStatuses.has(status);
    })
    .map((entry) => ({
      source: "MYANIMELIST" as const,
      sourceId: entry.series_title ? entry.series_title.toLowerCase() : null,
      malId: Number(entry.series_mangadb_id ?? (mediaType === "manga" ? entry.manga_id : entry.anime_id) ?? 0) || null,
      title: entry.series_title ?? "Unknown title",
    }));
}